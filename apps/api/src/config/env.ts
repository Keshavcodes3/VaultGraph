import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load apps/api/.env explicitly so the server works whether it's started
// from apps/api or from the repo root (turbo, bun --watch, etc.).
// Real environment variables still win (override: false is the default).
// NOTE: this module must be imported FIRST (before app/db modules) because
// those read process.env at import time.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", "..", ".env") });
dotenv.config();
