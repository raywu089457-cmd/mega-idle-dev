import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { subscribeUser } from "@/lib/broadcast";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const userId = token?.sub || null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected event with userId
      const connectedEvent = `event: connected\ndata: ${JSON.stringify({ userId: userId || "anonymous" })}\n\n`;
      controller.enqueue(encoder.encode(connectedEvent));

      if (!userId) {
        // No auth - don't subscribe to user updates
        return;
      }

      // Subscribe to user-specific events
      const unsubscribe = subscribeUser(userId, "user-update", (data: string) => {
        try {
          const parsed = JSON.parse(data);
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