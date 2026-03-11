import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { subscribeToChatEvents, ChatEvent } from "@/lib/chat-emitter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    // Authenticate using session cookie
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;

    if (!sessionId) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
        where: { id: Number(sessionId) },
        select: { id: true },
    });

    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const userId = user.id;

    // Create a readable stream for SSE
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Send initial heartbeat
            controller.enqueue(encoder.encode(": connected\n\n"));

            // Subscribe to chat events for this user
            const unsubscribe = subscribeToChatEvents(String(userId), (event: ChatEvent) => {
                try {
                    const data = JSON.stringify(event);
                    controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${data}\n\n`));
                } catch (err) {
                    // Stream might be closed
                    console.error("[SSE] Error writing to stream:", err);
                }
            });

            // Send heartbeat every 30 seconds to keep connection alive
            const heartbeatInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(": heartbeat\n\n"));
                } catch {
                    clearInterval(heartbeatInterval);
                }
            }, 30000);

            // Cleanup on abort (client disconnects)
            req.signal.addEventListener("abort", () => {
                unsubscribe();
                clearInterval(heartbeatInterval);
                try {
                    controller.close();
                } catch {
                    // Already closed
                }
            });
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
