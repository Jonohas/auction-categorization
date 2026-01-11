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
}

async function callAzureOpenAI(
  systemPrompt: string,
  userPrompt: string
): Promise<CategoryProbabilitiesResponse> {
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

    const result = JSON.parse(content) as CategoryProbabilitiesResponse;
    return result;
  } catch (error) {
    console.error("Error calling Azure OpenAI:", error);
    return {};
  }
}

function buildSystemPrompt(categories: CategoryInfo[]): string {
  const categoryList = categories
    .map((cat) => {
      const desc = cat.description ? ` - ${cat.description}` : "";
      return `- Name: "${cat.name}"${desc} (ID: ${cat.id})`;
    })
    .join("\n");

  return `You are a helpful assistant that categorizes auction items.
Your task is to analyze the item title and description, then determine the probability that each category matches the item.

## Available Categories:
${categoryList}

## Rules:
- Return a JSON object where keys are CATEGORY NAMES (not IDs) and values are probabilities (0-1)
- Probabilities should sum to approximately 1 across all categories
- Consider the item's title and description carefully
- Use the category descriptions to help determine the best match
- Be conservative with probabilities - only give high confidence to clear matches

## Output Format:
Return a JSON object like:
{
  "Category Name 1": 0.75,
  "Category Name 2": 0.20,
  "Category Name 3": 0.05
}

Only include categories with probability > 0.01`;
}

function buildUserPrompt(item: CategorizeItemInput): string {
  return `## Item to Categorize:
Title: ${item.title}
Description: ${item.description || "No description available"}

Analyze this item and provide category probabilities.`;
}

export interface CategorizeItemResult {
  itemId: string;
  probabilities: CategoryProbabilityResult[];
}

export interface CategorizationResult {
  itemId: string;
  probabilities: CategoryProbabilityResult[];
  error?: string;
}

/**
 * Categorize a single item using AI
 */
export async function categorizeItem(
  item: CategorizeItemInput,
  categories: CategoryInfo[]
): Promise<CategorizeItemResult> {
  if (categories.length === 0) {
    return {
      itemId: item.id,
      probabilities: [],
    };
  }

  const systemPrompt = buildSystemPrompt(categories);
  const userPrompt = buildUserPrompt(item);

  const probabilities = await callAzureOpenAI(systemPrompt, userPrompt);

  // Create a map of category name -> id for lookup
  const nameToIdMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  const results: CategoryProbabilityResult[] = Object.entries(probabilities)
    .filter(([name, prob]) => prob > 0.01)
    .map(([name, prob]) => ({
      categoryId: nameToIdMap.get(name.toLowerCase()) || name, // Fallback to name if not found
      probability: Math.max(0, Math.min(1, prob)),
    }))
    .filter((r) => r.categoryId !== r.probability.toString()) // Filter out entries where categoryId is not a valid ID
    .sort((a, b) => b.probability - a.probability);

  return {
    itemId: item.id,
    probabilities: results,
  };
}

/**
 * Categorize multiple items using AI (batch processing)
 */
export async function categorizeItems(
  items: CategorizeItemInput[],
  categories: CategoryInfo[]
): Promise<CategorizationResult[]> {
  if (categories.length === 0 || items.length === 0) {
    return items.map((item) => ({
      itemId: item.id,
      probabilities: [] as CategoryProbabilityResult[],
    }));
  }

  // Process items in batches to avoid overwhelming the API
  const batchSize = 5;
  const results: CategorizationResult[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item) => categorizeItem(item, categories))
    );

    for (const result of batchResults) {
      results.push({
        itemId: result.itemId,
        probabilities: result.probabilities,
      });
    }

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Categorize all items in an auction
 */
export async function categorizeAuctionItems(
  auctionId: string,
  items: CategorizeItemInput[],
  categories: CategoryInfo[]
): Promise<CategorizationResult[]> {
  return categorizeItems(items, categories);
}
