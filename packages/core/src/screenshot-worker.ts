import { sql } from "./db";
import { getScreenshotWorkerCandidates, setToolScreenshotResult } from "./repo";

function isWorkerEnabled() {
  const raw = String(process.env.SCREENSHOT_WORKER_ENABLED ?? "").toLowerCase().trim();
  return raw === "1" || raw === "true" || raw === "yes";
}

function buildScreenshotUrl(pageUrl: string) {
  return `https://image.thum.io/get/width/1200/noanimate/${pageUrl}`;
}

async function validateImageUrl(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) return false;

    const contentType = response.headers.get("content-type") ?? "";
    return contentType.startsWith("image/");
  } catch {
    return false;
  }
}

async function run() {
  if (!isWorkerEnabled()) {
    console.log("[screenshot-worker] disabled by SCREENSHOT_WORKER_ENABLED");
    return;
  }

  const limitArg = Number.parseInt(process.argv[2] ?? "20", 10);
  const limit = Number.isFinite(limitArg) ? limitArg : 20;
  const candidates = await getScreenshotWorkerCandidates(limit);

  if (candidates.length === 0) {
    console.log("[screenshot-worker] no candidates");
    return;
  }

  console.log(`[screenshot-worker] processing ${candidates.length} tools`);

  for (const tool of candidates) {
    const screenshotUrl = buildScreenshotUrl(tool.url);
    const ok = await validateImageUrl(screenshotUrl);

    if (ok) {
      await setToolScreenshotResult(tool.id, { screenshotUrl, status: "ready" });
      console.log(`[screenshot-worker] ready ${tool.id}`);
    } else {
      await setToolScreenshotResult(tool.id, { screenshotUrl: null, status: "failed" });
      console.log(`[screenshot-worker] failed ${tool.id} ${tool.url}`);
    }
  }
}

run().catch((error) => {
  console.error("[screenshot-worker] fatal", error);
  process.exitCode = 1;
}).finally(async () => {
  await sql.end({ timeout: 5 });
});
