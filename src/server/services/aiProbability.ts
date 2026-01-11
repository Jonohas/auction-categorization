import OpenAI from "openai";
import { loadConfig } from "../lib/config";

interface ProbabilityResult {
  probability: number;
}

async function callAiModel(prompt: string): Promise<number> {
  const config = loadConfig();

  if (!config.ai.api_key) {
    // Return default probability if no API key is configured
    return 0.5;
  }

  const openai = new OpenAI({
    apiKey: config.ai.api_key,
    baseURL: config.ai.base_url || undefined,
  });

  try {
    const response = await openai.chat.completions.create({
      model: config.ai.model,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that analyzes auction listings to determine the probability that they contain computer hardware or server equipment. Return a JSON object with a single field "probability" that is a number between 0 and 1. Higher values mean more likely to be computer hardware/server related. Consider:
- Servers, rack servers, blade servers
- CPUs, GPUs, RAM/memory
- Storage devices, SSDs, hard drives
- Network equipment (switches, routers)
- Computer components and accessories
- Workstations and enterprise hardware`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return 0.5;
    }

    const result = JSON.parse(content) as ProbabilityResult;
    return Math.max(0, Math.min(1, result.probability));
  } catch (error) {
    console.error("Error calling AI model:", error);
    return 0.5;
  }
}

export interface ScoringInput {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
}

export async function calculateHardwareProbability(
  input: ScoringInput
): Promise<number> {
  const prompt = `Analyze this auction listing and determine the probability it contains computer hardware or server equipment:

Title: ${input.title}
Description: ${input.description || "No description available"}
Image URL: ${input.imageUrl || "No image available"}

Return a JSON object with the probability.`;

  return callAiModel(prompt);
}

export async function calculateHardwareProbabilityBatch(
  inputs: ScoringInput[]
): Promise<number[]> {
  const results = await Promise.all(
    inputs.map((input) => calculateHardwareProbability(input))
  );
  return results;
}
