import { processBatch } from "./processor.ts";

Deno.serve(async (req) => {
  // Each invocation is an independent worker — Supabase runs N concurrently.
  // Worker identity comes from request header (set by invoker) or generated per-invocation.
  const workerId = req.headers.get("x-worker-id") ?? crypto.randomUUID();

  try {
    const result = await processBatch(workerId);
    return Response.json({ ok: true, workerId, ...result });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
});
