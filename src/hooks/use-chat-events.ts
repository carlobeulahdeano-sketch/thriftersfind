"use client";

import { useEffect, useRef, useCallback } from "react";

export interface ChatEventData {
    type: "new-message";
    senderId: string;
    senderName: string;
    messageId: string;
    content: string;
    createdAt: string;
}

type ChatEventHandler = (event: ChatEventData) => void;

/**
 * Custom hook that connects to the SSE chat-events endpoint
 * and calls the handler whenever a new message event arrives.
 */
export function useChatEvents(onEvent: ChatEventHandler, enabled: boolean = true) {
    const handlerRef = useRef(onEvent);
    handlerRef.current = onEvent;

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = useCallback(() => {
        if (!enabled) return;

        // Clean up existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        const es = new EventSource("/api/chat-events");
        eventSourceRef.current = es;

        es.addEventListener("new-message", (e: MessageEvent) => {
            try {
                const data: ChatEventData = JSON.parse(e.data);
                handlerRef.current(data);
            } catch (err) {
                console.error("[useChatEvents] Failed to parse event:", err);
            }
        });

        es.onerror = () => {
            es.close();
            eventSourceRef.current = null;

            // Reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, 3000);
        };
    }, [enabled]);

    useEffect(() => {
        connect();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [connect]);
}
