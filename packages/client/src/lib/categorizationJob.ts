export interface CategorizationJob {
  id: number;
  status: "pending" | "running" | "completed" | "failed";
  totalItems: number;
  processedItems: number;
  error: string | null;
}

const POLL_INTERVAL_MS = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function readJson(response: Response, fallbackError: string) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || fallbackError);
  }
  return data;
}

/**
 * Queue a categorization job and poll until it finishes.
 * Resolves with the completed job; rejects when the job fails.
 */
export async function runCategorizationJob(
  endpoint: "/api/categorization/item" | "/api/categorization/items" | "/api/categorization/auction",
  body: Record<string, unknown>,
  onProgress?: (job: CategorizationJob) => void
): Promise<CategorizationJob> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let job: CategorizationJob = await readJson(response, "Failed to start categorization");

  while (job.status === "pending" || job.status === "running") {
    onProgress?.(job);
    await sleep(POLL_INTERVAL_MS);
    job = await readJson(
      await fetch(`/api/categorization/jobs/${job.id}`),
      "Failed to fetch categorization progress"
    );
  }

  if (job.status === "failed") {
    throw new Error(job.error || "Categorization failed");
  }
  return job;
}
