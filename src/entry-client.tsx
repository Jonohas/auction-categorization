import { createStartClient } from "@tanstack/start/client";
import { getRouter } from "./server/index";

export const { router, hydration } = createStartClient({
  router: getRouter(),
});
