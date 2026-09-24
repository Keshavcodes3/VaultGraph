import "./src/config/env";
import { createApp } from "./src/app";
import { ensureSchema } from "./src/prisma/ensureSchema";

const PORT = Number(process.env["PORT"] ?? 4000);

if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

if (!process.env["JWT_SECRET"]) {
  throw new Error("JWT_SECRET is not set. Add it to your .env file.");
}

// Verify (and, on a stale/empty dev database, rebuild) the PostgreSQL
// schema before accepting requests — otherwise every query fails with
// errors like `column user.createdAt does not exist`.
await ensureSchema();

const app = createApp();

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

export default app;
