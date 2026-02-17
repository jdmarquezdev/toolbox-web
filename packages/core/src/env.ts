import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadDotenv } from "dotenv";

import { z } from "zod";

loadDotenv();

if (!process.env.DATABASE_URL) {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  loadDotenv({ path: resolve(currentDir, "../../../.env") });
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgres://postgres:postgres@localhost:5432/toolbox"),
  SESSION_SECRET: z.string().min(16).default("dev-session-secret-change-me"),
  INGEST_TOKEN: z.string().min(8).default("dev-ingest-token"),
  SCREENSHOT_WORKER_ENABLED: z.string().optional(),
  OWNER_EMAIL: z.string().email().default("owner@toolbox.local"),
  OWNER_PASSWORD: z.string().min(8).default("changeme123"),
  PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:5173")
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  INGEST_TOKEN: process.env.INGEST_TOKEN,
  SCREENSHOT_WORKER_ENABLED: process.env.SCREENSHOT_WORKER_ENABLED,
  OWNER_EMAIL: process.env.OWNER_EMAIL,
  OWNER_PASSWORD: process.env.OWNER_PASSWORD,
  PUBLIC_API_BASE_URL: process.env.PUBLIC_API_BASE_URL
});
