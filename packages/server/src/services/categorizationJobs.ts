import { db } from "../db/db.ts";
import { auctionItem, categorizationJobs } from "../db/schema.ts";
import { asc, eq, inArray } from "drizzle-orm";
import { categorizeItemsBulk } from "./aiCategorization.ts";
import { loadCategoriesForAI, saveCategorizationResults, type CategoryForAI } from "./categorizationResults.ts";

// Items categorized and saved per step; progress is persisted after each chunk
const CHUNK_SIZE = 50;

export type CategorizationJob = typeof categorizationJobs.$inferSelect;
export type CategorizationJobView = Omit<CategorizationJob, "itemIds">;

interface EnqueueOptions {
  itemIds: number[];
  auctionId?: number;
}

let workerRunning = false;

/**
 * API shape of a job; omits the item ID list, which can hold thousands of entries
 */
export function toJobView({ itemIds: _itemIds, ...view }: CategorizationJob): CategorizationJobView {
  return view;
}

/**
 * Persist a categorization job and wake the worker. Returns immediately.
 */
export async function enqueueCategorizationJob({ itemIds, auctionId }: EnqueueOptions): Promise<CategorizationJob> {
  const [job] = await db.insert(categorizationJobs).values({
    createdAt: new Date(),
    itemIds,
    totalItems: itemIds.length,
    auctionId: auctionId ?? null,
  }).returning();

  startWorker();
  return job!;
}

export async function getCategorizationJob(id: number): Promise<CategorizationJob | undefined> {
  return db.query.categorizationJobs.findFirst({
    where: eq(categorizationJobs.id, id),
  });
}

/**
 * Requeue jobs interrupted by a restart and start processing the queue
 */
export async function resumeCategorizationJobs(): Promise<void> {
  await db.update(categorizationJobs)
    .set({ status: "pending", startedAt: null })
    .where(eq(categorizationJobs.status, "running"));
  startWorker();
}

function startWorker(): void {
  if (workerRunning) return;
  workerRunning = true;
  void drainQueue().finally(() => {
    workerRunning = false;
  });
}

async function drainQueue(): Promise<void> {
  let job = await nextPendingJob();
  while (job) {
    await runJob(job);
    job = await nextPendingJob();
  }
}

async function nextPendingJob(): Promise<CategorizationJob | undefined> {
  return db.query.categorizationJobs.findFirst({
    where: eq(categorizationJobs.status, "pending"),
    orderBy: asc(categorizationJobs.id),
  });
}

async function runJob(job: CategorizationJob): Promise<void> {
  await updateJob(job.id, { status: "running", startedAt: new Date(), processedItems: 0, error: null });

  try {
    const categories = await loadCategoriesForAI();
    if (categories.length === 0) {
      throw new Error("No categories defined");
    }

    let processed = 0;
    for (let i = 0; i < job.itemIds.length; i += CHUNK_SIZE) {
      const chunkIds = job.itemIds.slice(i, i + CHUNK_SIZE);
      await categorizeChunk(chunkIds, categories);
      processed += chunkIds.length;
      await updateJob(job.id, { processedItems: processed });
    }

    await updateJob(job.id, { status: "completed", finishedAt: new Date() });
  } catch (error) {
    console.error(`[Categorization Job ${job.id}] Failed:`, error);
    await updateJob(job.id, {
      status: "failed",
      finishedAt: new Date(),
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function categorizeChunk(itemIds: number[], categories: CategoryForAI[]): Promise<void> {
  const items = await db.query.auctionItem.findMany({
    where: inArray(auctionItem.id, itemIds),
  });
  if (items.length === 0) return;

  const results = await categorizeItemsBulk(
    items.map((item) => ({
      id: item.id.toString(),
      title: item.title,
      description: item.description,
    })),
    categories
  );
  await saveCategorizationResults(results);
}

async function updateJob(id: number, values: Partial<typeof categorizationJobs.$inferInsert>): Promise<void> {
  await db.update(categorizationJobs).set(values).where(eq(categorizationJobs.id, id));
}
