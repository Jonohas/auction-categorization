import {dispatch} from "./tools/endpointRegister.ts";

Bun.serve({
  fetch(req: Request) {
    return dispatch(req);
  },
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, most likely from docker.");
  process.exit(0);
});
