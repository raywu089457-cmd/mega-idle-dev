import { subscribe, broadcast } from "@/lib/broadcast";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const userId = "anonymous"; // SSE does not have auth via getServerSession

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected event
      const connectedEvent = `event: connected\ndata: ${JSON.stringify({ userId })}\n\n`;
      controller.enqueue(encoder.encode(connectedEvent));

      // Subscribe to user-update events and forward to client
      const unsubscribe = subscribe("user-update", (data: string) => {
        try {
          const parsed = JSON.parse(data);
          // Only send events for this specific user
          if (parsed.userId === userId) {
            const message = `event: user-update\ndata: ${data}\n\n`;
            controller.enqueue(encoder.encode(message));
          }
        } catch {
          // Invalid JSON, skip
        }
      });

      // Cleanup on close
      const cleanup = () => {
        unsubscribe();
      };

      // Store cleanup for potential AbortController trigger
      // Client disconnect is handled by the browser automatically closing connection
      // which causes the ReadableStream to abort
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