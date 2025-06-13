import type {
  CoreAssistantMessage,
  CoreSystemMessage,
  CoreToolMessage,
  CoreUserMessage,
} from "ai";
import { lastValueFrom } from "rxjs";
import { createSignal, For, from } from "solid-js";
import { config$, messages$, rpcClient } from "../services/rpc";
import { MessagesIcon, SendIcon, SettingsIcon, UserIcon } from "./Icons";

interface ChatInterfaceProps {
  onSettings: () => void;
}

export default function ChatInterface(props: ChatInterfaceProps) {
  const config = from(config$);
  const messages = from(messages$);
  const [input, setInput] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  const hasApiConfig = () => !!config()?.apiUrl && !!config()?.apiKey;

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading()) return;

    setInput("");
    setIsLoading(true);

    try {
      await lastValueFrom(rpcClient.call("chat.message", content.trim()));
    } catch (error) {
      console.error("Chat error:", error);
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
          <SettingsIcon />
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
        ) : messages()?.length === 0 ? (
          <div class="text-center py-8 text-base-content/60">
            <MessagesIcon class="mx-auto mb-4 size-16" />
            <p class="text-lg">Start a conversation</p>
            <p class="text-sm">
              Type a message below to begin chatting with AI
            </p>
          </div>
        ) : (
          <For each={messages()}>
            {(message) => {
              switch (message.role) {
                case "system":
                  return <ChatSystemMessage message={message} />;
                case "user":
                  return <ChatUserMessage message={message} />;
                case "assistant":
                  return <ChatAssistantMessage message={message} />;
                case "tool":
                  return <ChatToolMessage message={message} />;
                default:
                  return null;
              }
            }}
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
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatSystemMessage({ message }: { message: CoreSystemMessage }) {
  return (
    <div class="chat chat-center">
      <div class="chat-header font-semibold text-xs text-base-content/60">
        System
      </div>
      <div class="chat-bubble whitespace-pre-wrap bg-base-200 text-base-content/70">
        {message.content}
      </div>
    </div>
  );
}

function ChatUserMessage({ message }: { message: CoreUserMessage }) {
  return (
    <div class="chat chat-end">
      <div class="chat-image avatar">
        <div class="bg-primary text-primary-content w-10 h-10 rounded-full flex items-center justify-center">
          <UserIcon />
        </div>
      </div>
      <div class="chat-header">You</div>
      <div class="chat-bubble whitespace-pre-wrap chat-bubble-primary">
        {renderUserContent(message.content)}
      </div>
    </div>
  );
}

function ChatAssistantMessage({ message }: { message: CoreAssistantMessage }) {
  return (
    <div class="chat chat-start">
      <div class="chat-image avatar">
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
      </div>
      <div class="chat-header">AI Assistant</div>
      <div class="chat-bubble whitespace-pre-wrap chat-bubble-secondary">
        {renderAssistantContent(message.content)}
      </div>
    </div>
  );
}

function ChatToolMessage({ message }: { message: CoreToolMessage }) {
  return (
    <div class="chat chat-center">
      <div class="chat-header font-semibold text-xs text-base-content/60">
        Tool
      </div>
      <div class="chat-bubble whitespace-pre-wrap bg-base-300 text-base-content/80">
        {renderToolContent(message.content)}
      </div>
    </div>
  );
}

function renderUserContent(content: any) {
  if (typeof content === "string") return content;
  // TODO: handle array of TextPart | ImagePart | FilePart
  return JSON.stringify(content);
}

function renderAssistantContent(content: any) {
  if (typeof content === "string") return content;
  // TODO: handle array of TextPart | FilePart | ReasoningPart | RedactedReasoningPart | ToolCallPart
  return JSON.stringify(content);
}

function renderToolContent(content: any) {
  // content is ToolContent (array of ToolResultPart)
  return JSON.stringify(content);
}
