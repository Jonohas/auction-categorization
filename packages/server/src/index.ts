import {dispatch} from "./tools/endpointRegister.ts";
import {resumeCategorizationJobs} from "./services/categorizationJobs.ts";

Bun.serve({
  fetch(req: Request) {
    return dispatch(req);
  },
});

await resumeCategorizationJobs();

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, most likely from docker.");
  process.exit(0);
});
