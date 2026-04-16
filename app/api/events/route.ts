import { subscribe } from "@/lib/broadcast";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected event
      const connectedEvent = `event: connected\ndata: ${JSON.stringify({})}\n\n`;
      controller.enqueue(encoder.encode(connectedEvent));

      // Subscribe to all user-update events and forward to client
      // Client filters by matching userId from the update with its own session
      const unsubscribe = subscribe("user-update", (data: string) => {
        const message = `event: user-update\ndata: ${data}\n\n`;
        controller.enqueue(encoder.encode(message));
      });

      const cleanup = () => {
        unsubscribe();
      };

      return cleanup;
    },
    cancel() {
      // Called when client disconnects
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
