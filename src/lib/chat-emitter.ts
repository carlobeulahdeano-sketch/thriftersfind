/**
 * In-memory chat event emitter for SSE real-time notifications.
 * Uses a global Map to track connected SSE clients by userId.
 */

export interface ChatEvent {
    type: "new-message";
    senderId: string;
    senderName: string;
    messageId: string;
    content: string;
    createdAt: string;
}

type ChatEventCallback = (event: ChatEvent) => void;

// Use globalThis to persist across hot reloads in development
const globalForChat = globalThis as unknown as {
    chatListeners?: Map<string, Set<ChatEventCallback>>;
};

if (!globalForChat.chatListeners) {
    globalForChat.chatListeners = new Map();
}

const listeners = globalForChat.chatListeners;

/**
 * Subscribe a user to real-time chat events
 */
export function subscribeToChatEvents(userId: string, callback: ChatEventCallback): () => void {
    if (!listeners.has(userId)) {
        listeners.set(userId, new Set());
    }
    listeners.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
        const userListeners = listeners.get(userId);
        if (userListeners) {
            userListeners.delete(callback);
            if (userListeners.size === 0) {
                listeners.delete(userId);
            }
        }
    };
}

/**
 * Notify a user of a new chat event (called from server actions)
 */
export function notifyChatEvent(userId: string, event: ChatEvent): void {
    const userListeners = listeners.get(userId);
    if (userListeners) {
        for (const callback of userListeners) {
            try {
                callback(event);
            } catch (err) {
                console.error("[ChatEmitter] Error in listener callback:", err);
            }
        }
    }
}
