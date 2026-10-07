import { getCategorizationJob, toJobView } from "../../../../services/categorizationJobs.ts";
import type { RouteHandler } from "../../../../types/requestTypes.ts";

/**
 * GET /api/categorization/jobs/:id - Get categorization job status and progress
 */
export const GET: RouteHandler = async (req) => {
  try {
    const jobId = parseInt(req.params.id ?? "", 10);
    if (isNaN(jobId)) {
      return Response.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const job = await getCategorizationJob(jobId);
    if (!job) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    return Response.json(toJobView(job));
  } catch (error) {
    console.error("Error fetching categorization job:", error);
    return Response.json({ error: "Failed to fetch categorization job" }, { status: 500 });
  }
};
