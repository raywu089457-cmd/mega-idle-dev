import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { subscribe } from "@/lib/broadcast";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected event with user context
      const connectedEvent = `event: connected\ndata: ${JSON.stringify({ userId })}\n\n`;
      controller.enqueue(encoder.encode(connectedEvent));

      // Subscribe to user-update events for this specific user
      const unsubscribe = subscribe("user-update", (data: string) => {
        try {
          // Only forward events for this user
          const payload = JSON.parse(data);
          if (payload.userId !== userId) return;

          const message = `event: user-update\ndata: ${data}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Controller may be closed (client disconnected) - unsubscribe to avoid errors
          unsubscribe();
        }
      });

      // Keep-alive interval: send comment every second
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          // Controller closed - clear interval and unsubscribe
          clearInterval(keepAlive);
          unsubscribe();
        }
      }, 1000);

      // Cleanup when stream is cancelled
      const cleanup = () => {
        clearInterval(keepAlive);
        try {
          unsubscribe();
        } catch {
          // Already unsubscribed
        }
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
