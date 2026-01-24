import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import {join} from "node:path"; // Path to your schema definitions

const rawUrl = process.env.DATABASE_URL!.replace(/^file:/, "");

// 1. Get the directory of the current file
const __dirname = import.meta.dir;

// 2. Resolve the path relative to THIS file, not the process CWD
// This assumes sqlite.db is in the same folder as this file
const dbPath = join(__dirname, "../..", rawUrl);

export const db = drizzle(dbPath, {schema});