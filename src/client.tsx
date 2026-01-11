import { mount, StartClient } from "@tanstack/start/client";
import { App } from "./app";

mount(() => <App />, {
  appId: "auction-scraper",
});
