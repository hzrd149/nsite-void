import { createSignal, For, from } from "solid-js";
import { rpc } from "../services/rpc-client";

interface ChatInterfaceProps {
  onSettings: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface(props: ChatInterfaceProps) {
  const config = from(rpc.getConfig());
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [input, setInput] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  const hasApiConfig = () => !!config()?.apiUrl && !!config()?.apiKey;

  const generateId = () =>
    Math.random().toString(36).substring(2) + Date.now().toString(36);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !hasApiConfig() || isLoading()) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${config()?.apiUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config()?.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [...messages(), userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") break;

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessage.id
                          ? { ...m, content: m.content + delta }
                          : m,
                      ),
                    );
                  }
                } catch (e) {
                  // Skip invalid JSON lines
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message to the assistant message if it was created
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (
          lastMessage &&
          lastMessage.role === "assistant" &&
          lastMessage.content === ""
        ) {
          return prev.map((m) =>
            m.id === lastMessage.id
              ? {
                  ...m,
                  content:
                    "Sorry, I encountered an error. Please check your API configuration and try again.",
                }
              : m,
          );
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    sendMessage(input());
  };

  return (
    <div class="flex flex-col h-full">
      {/* Header */}
      <div class="flex items-center justify-between p-4 border-b">
        <h2 class="text-xl font-bold">AI Chat</h2>
        <button
          class="btn btn-ghost btn-sm btn-circle"
          onClick={props.onSettings}
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasApiConfig() ? (
          <div class="text-center py-8">
            <div class="alert alert-warning max-w-md mx-auto">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 class="font-bold">API Configuration Required</h3>
                <div class="text-sm">
                  Please configure your OpenAI API settings first.
                </div>
              </div>
            </div>
            <button class="btn btn-primary mt-4" onClick={props.onSettings}>
              Configure API
            </button>
          </div>
        ) : messages().length === 0 ? (
          <div class="text-center py-8 text-base-content/60">
            <svg
              class="w-16 h-16 mx-auto mb-4 text-base-content/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p class="text-lg">Start a conversation</p>
            <p class="text-sm">
              Type a message below to begin chatting with AI
            </p>
          </div>
        ) : (
          <For each={messages()}>
            {(message) => (
              <div
                class={`chat ${message.role === "user" ? "chat-end" : "chat-start"}`}
              >
                <div class="chat-image avatar">
                  <div class="w-10 rounded-full">
                    {message.role === "user" ? (
                      <div class="bg-primary text-primary-content w-10 h-10 rounded-full flex items-center justify-center">
                        <svg
                          class="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div class="bg-secondary text-secondary-content w-10 h-10 rounded-full flex items-center justify-center">
                        <svg
                          class="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div class="chat-header">
                  {message.role === "user" ? "You" : "AI Assistant"}
                </div>
                <div
                  class={`chat-bubble ${message.role === "user" ? "chat-bubble-primary" : "chat-bubble-secondary"}`}
                >
                  {message.content}
                </div>
              </div>
            )}
          </For>
        )}

        {isLoading() && (
          <div class="chat chat-start">
            <div class="chat-image avatar">
              <div class="bg-secondary text-secondary-content w-10 h-10 rounded-full flex items-center justify-center">
                <span class="loading loading-dots loading-sm"></span>
              </div>
            </div>
            <div class="chat-header">AI Assistant</div>
            <div class="chat-bubble chat-bubble-secondary">
              <span class="loading loading-dots loading-sm"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div class="p-4 border-t">
        <form onSubmit={handleSubmit} class="flex gap-2">
          <input
            type="text"
            placeholder={
              hasApiConfig()
                ? "Type your message..."
                : "Configure API settings first"
            }
            class="input input-bordered flex-1"
            value={input()}
            onInput={(e) => setInput(e.currentTarget.value)}
            disabled={!hasApiConfig() || isLoading()}
          />
          <button
            type="submit"
            class="btn btn-primary"
            disabled={!hasApiConfig() || isLoading() || !input().trim()}
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
