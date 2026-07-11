import { getServerLogs, addLogListener } from "@/lib/server-process-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get("id");

  if (!serverId) {
    return new Response("Missing id param", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (line: string) => {
        controller.enqueue(encoder.encode(`data: ${line}\n\n`));
        if (line === "__EXIT__") {
          controller.close();
        }
      };

      // Send existing logs first
      const existing = getServerLogs(serverId);
      existing.forEach(send);

      // Listen for new logs
      const unsub = addLogListener(serverId, send);

      // Clean up on close
      req.signal?.addEventListener("abort", () => {
        unsub();
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
