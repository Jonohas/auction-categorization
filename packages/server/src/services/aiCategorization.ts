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

  // Find the "Other" system category for fallback
  const otherCategory = categories.find((c) => c.isSystem && c.name.toLowerCase() === "other");

  // Log any category names returned by AI that don't match valid categories
  const validCategoryNames = new Set(categories.map((c) => c.name.toLowerCase()));
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
      `[AI Categorization] Unmatched categories for item "${item.title}" (ID: ${item.id}):`,
      {
        unmatchedCategories,
        unmatchedProbability,
        validCategories: categories.map((c) => c.name),
        aiResponse: probabilities,
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
 * This significantly reduces token usage compared to individual calls
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

  // Process items in batches - each batch is a single AI call
  // Batch size of 10 balances token efficiency with response quality
  const batchSize = 10;
  const results: CategorizationResult[] = [];

  const systemPrompt = buildBulkSystemPrompt(categories);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const userPrompt = buildBulkUserPrompt(batch);

    console.log(`[AI Bulk Categorization] Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(items.length / batchSize)} (${batch.length} items)`);

    const bulkResponse = await callAzureOpenAIBulk(systemPrompt, userPrompt);
    const batchResults = processBulkResponse(bulkResponse, batch, categories);
    results.push(...batchResults);

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Categorize multiple items using AI (batch processing) - legacy method, calls AI per item
 * @deprecated Use categorizeItemsBulk for better token efficiency
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
 * Categorize all items in an auction using bulk processing
 */
export async function categorizeAuctionItems(
  auctionId: string,
  items: CategorizeItemInput[],
  categories: CategoryInfo[],
  useBulk: boolean = true
): Promise<CategorizationResult[]> {
  if (useBulk) {
    return categorizeItemsBulk(items, categories);
  }
  return categorizeItems(items, categories);
}
