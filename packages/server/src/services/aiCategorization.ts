import OpenAI from "openai";
import { loadConfig } from "../lib/config";

interface CategoryProbabilityResult {
  categoryId: string;
  probability: number;
}

interface CategoryProbabilitiesResponse {
  [categoryId: string]: number;
}

interface CategorizeItemInput {
  id: string;
  title: string;
  description?: string | null;
}

interface CategoryInfo {
  id: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
}

function buildBulkUserPrompt(items: CategorizeItemInput[]): string {
  const itemsList = items
    .map(
      (item, index) =>
        `### Item ${index + 1} (ID: ${item.id})
Title: ${item.title}
Description: ${item.description || "No description available"}`
    )
    .join("\n\n");

  return `## Items to Categorize:

${itemsList}

Analyze each item and provide category probabilities for all of them.`;
}

function buildBulkSystemPrompt(categories: CategoryInfo[]): string {
  const categoryList = categories
    .map((cat) => {
      const desc = cat.description ? ` - ${cat.description}` : "";
      return `- Name: "${cat.name}"${desc} (ID: ${cat.id})`;
    })
    .join("\n");

  return `You are a helpful assistant that categorizes auction items.
Your task is to analyze multiple item titles and descriptions, then determine the probability that each category matches each item.

## Available Categories:
${categoryList}

## Rules:
- Return a JSON object where keys are ITEM IDs and values are objects with category probabilities
- Each item's category probabilities should have category NAMES as keys and probabilities (0-1) as values
- Probabilities for each item should sum to approximately 1 across all categories
- Consider each item's title and description carefully
- Use the category descriptions to help determine the best match
- Be conservative with probabilities - only give high confidence to clear matches

## Output Format:
Return a JSON object like:
{
  "item_id_1": {
    "Category Name 1": 0.75,
    "Category Name 2": 0.20,
    "Category Name 3": 0.05
  },
  "item_id_2": {
    "Category Name 1": 0.10,
    "Category Name 2": 0.85,
    "Category Name 3": 0.05
  }
}

Only include categories with probability > 0.01 for each item.`;
}

interface BulkCategoryProbabilitiesResponse {
  [itemId: string]: CategoryProbabilitiesResponse;
}

async function callAzureOpenAIBulk(
  systemPrompt: string,
  userPrompt: string
): Promise<BulkCategoryProbabilitiesResponse> {
  const config = loadConfig();

  if (!config.ai.azure_endpoint || !config.ai.azure_deployment) {
    console.warn("Azure OpenAI not configured, returning default probabilities");
    return {};
  }

  const client = new OpenAI({
    apiKey: config.ai.api_key,
    baseURL: `${config.ai.azure_endpoint.replace(/\/$/, "")}/openai/deployments/${config.ai.azure_deployment}`,
    defaultQuery: {
      "api-version": config.ai.azure_api_version,
    },
  });

  try {
    const response = await client.chat.completions.create({
      model: config.ai.azure_deployment,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn("Empty response from Azure OpenAI");
      return {};
    }

    const result = JSON.parse(content) as BulkCategoryProbabilitiesResponse;
    return result;
  } catch (error) {
    console.error("Error calling Azure OpenAI (bulk):", error);
    return {};
  }
}

export interface CategorizationResult {
  itemId: string;
  probabilities: CategoryProbabilityResult[];
  error?: string;
}

/**
 * Process the bulk response and convert to categorization results
 */
function processBulkResponse(
  bulkResponse: BulkCategoryProbabilitiesResponse,
  items: CategorizeItemInput[],
  categories: CategoryInfo[]
): CategorizationResult[] {
  // Create a map of category name -> id for lookup
  const nameToIdMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
  const validCategoryNames = new Set(categories.map((c) => c.name.toLowerCase()));
  
  // Find the "Other" system category for fallback
  const otherCategory = categories.find((c) => c.isSystem && c.name.toLowerCase() === "other");

  return items.map((item) => {
    const probabilities = bulkResponse[item.id] || {};
    
    // Log any category names returned by AI that don't match valid categories
    const returnedCategories = Object.keys(probabilities);
    const unmatchedCategories = returnedCategories.filter(
      (name) => !validCategoryNames.has(name.toLowerCase())
    );

    // Calculate the total probability assigned to unmatched categories
    let unmatchedProbability = 0;
    if (unmatchedCategories.length > 0) {
      unmatchedProbability = unmatchedCategories.reduce(
        (sum, name) => sum + (probabilities[name] || 0),
        0
      );
      console.warn(
        `[AI Bulk Categorization] Unmatched categories for item "${item.title}" (ID: ${item.id}):`,
        {
          unmatchedCategories,
          unmatchedProbability,
        }
      );
    }

    // Filter to only valid category matches
    const results: CategoryProbabilityResult[] = Object.entries(probabilities)
      .filter(([name, prob]) => prob > 0.01 && nameToIdMap.has(name.toLowerCase()))
      .map(([name, prob]) => ({
        categoryId: nameToIdMap.get(name.toLowerCase())!,
        probability: Math.max(0, Math.min(1, prob)),
      }))
      .sort((a, b) => b.probability - a.probability);

    // If there were unmatched categories and we have an "Other" category,
    // add that probability to "Other" as a fallback
    if (unmatchedProbability > 0 && otherCategory) {
      const existingOther = results.find((r) => r.categoryId === otherCategory.id);
      if (existingOther) {
        existingOther.probability = Math.min(1, existingOther.probability + unmatchedProbability);
      } else if (unmatchedProbability > 0.01) {
        results.push({
          categoryId: otherCategory.id,
          probability: Math.min(1, unmatchedProbability),
        });
        results.sort((a, b) => b.probability - a.probability);
      }
    }

    return {
      itemId: item.id,
      probabilities: results,
    };
  });
}

/**
 * Categorize multiple items using AI with true bulk processing (single AI call per batch)
 * This significantly reduces token usage compared to individual calls.
 * All batches are processed in parallel using Promise.all for faster throughput.
 */
export async function categorizeItemsBulk(
  items: CategorizeItemInput[],
  categories: CategoryInfo[]
): Promise<CategorizationResult[]> {
  if (categories.length === 0 || items.length === 0) {
    return items.map((item) => ({
      itemId: item.id,
      probabilities: [] as CategoryProbabilityResult[],
    }));
  }

  // Batch size of 10 balances token efficiency with response quality
  const batchSize = 10;
  const systemPrompt = buildBulkSystemPrompt(categories);

  // Split items into batches
  const batches: CategorizeItemInput[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  console.log(`[AI Bulk Categorization] Processing ${batches.length} batches in parallel (${items.length} total items)`);

  // Process all batches in parallel
  const batchPromises = batches.map(async (batch, index) => {
    const userPrompt = buildBulkUserPrompt(batch);
    console.log(`[AI Bulk Categorization] Starting batch ${index + 1} of ${batches.length} (${batch.length} items)`);

    const bulkResponse = await callAzureOpenAIBulk(systemPrompt, userPrompt);
    return processBulkResponse(bulkResponse, batch, categories);
  });

  const batchResults = await Promise.all(batchPromises);

  // Flatten results while preserving order
  return batchResults.flat();
}
