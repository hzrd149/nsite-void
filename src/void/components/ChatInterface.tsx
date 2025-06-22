import type {
  AssistantContent,
  CoreAssistantMessage,
  CoreSystemMessage,
  CoreToolMessage,
  CoreUserMessage,
  FilePart,
  TextPart,
  UserContent,
} from "ai";
import { lastValueFrom } from "rxjs";
import { createSignal, For, from, Show } from "solid-js";
import { config$, messages$, isLoading$, rpcClient } from "../services/rpc";
import {
  AssistantIcon,
  MessagesIcon,
  SendIcon,
  SettingsIcon,
  SystemIcon,
  ThinkingIcon,
  ToolIcon,
  UserIcon,
  WarningIcon,
} from "./Icons";
import StatusLight from "./StatusLight";

interface ChatInterfaceProps {
  onSettings: () => void;
}

export default function ChatInterface(props: ChatInterfaceProps) {
  const config = from(config$);
  const messages = from(messages$);
  const isLoading = from(isLoading$);
  const [input, setInput] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);

  const hasApiConfig = () => !!config()?.apiUrl && !!config()?.apiKey;

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading()) return;

    setInput("");
    setError(null); // Clear any previous error

    try {
      await lastValueFrom(rpcClient.call("chat.message", content.trim()));
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : String(err));
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
        <div class="flex items-center gap-3">
          <StatusLight isLoading={() => isLoading() || false} />
          <h2 class="text-xl font-bold">AI Chat</h2>
        </div>
        <button
          class="btn btn-ghost btn-sm btn-circle"
          onClick={props.onSettings}
        >
          <SettingsIcon />
        </button>
      </div>

      {/* Messages */}
      <div class="flex-1 flex flex-col-reverse overflow-y-auto p-4 space-y-3 space-y-reverse">
        {!hasApiConfig() ? (
          <div class="text-center py-8">
            <div class="alert alert-warning max-w-md mx-auto">
              <WarningIcon />
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
          <>
            {isLoading() && (
              <div class="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <div class="bg-secondary text-secondary-content w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AssistantIcon class="size-4" />
                  </div>
                  <div class="flex-1">
                    <div class="font-medium text-sm text-secondary mb-1">
                      AI Assistant
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="loading loading-dots loading-sm"></span>
                      <span class="text-sm text-base-content/60">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <For each={messages() ? Array.from(messages()!).reverse() : []}>
              {(message) => {
                message.content;
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
          </>
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
        <Show when={error()}>
          <div class="alert alert-error mt-2">
            <WarningIcon />
            <div>
              <h4 class="font-bold">Error sending message</h4>
              <div class="text-sm">{error()}</div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

function ChatSystemMessage({ message }: { message: CoreSystemMessage }) {
  return (
    <div class="bg-base-200/50 border border-base-300/50 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <div class="bg-base-300 text-base-content w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
          <SystemIcon class="size-4" />
        </div>
        <div class="flex-1">
          <div class="font-medium text-sm text-base-content/70 mb-1">
            System
          </div>
          <div class="text-sm text-base-content/60 whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatUserMessage({ message }: { message: CoreUserMessage }) {
  return (
    <div class="bg-primary/5 border border-primary/10 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <div class="bg-primary text-primary-content w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
          <UserIcon class="size-4" />
        </div>
        <div class="flex-1">
          <div class="font-medium text-sm text-primary mb-2">You</div>
          {renderUserContent(message.content)}
        </div>
      </div>
    </div>
  );
}

function ChatAssistantMessage({ message }: { message: CoreAssistantMessage }) {
  return (
    <div class="bg-secondary/5 border border-secondary/10 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <div class="bg-secondary text-secondary-content w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
          <AssistantIcon class="size-4" />
        </div>
        <div class="flex-1">
          <div class="font-medium text-sm text-secondary mb-2">
            AI Assistant
          </div>
          {renderAssistantContent(message.content)}
        </div>
      </div>
    </div>
  );
}

function ChatToolMessage({ message }: { message: CoreToolMessage }) {
  return (
    <div class="bg-base-200/30 border border-base-300/30 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <div class="bg-base-300 text-base-content w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
          <ToolIcon class="size-4" />
        </div>
        <div class="flex-1">
          <div class="font-medium text-sm text-base-content mb-2">
            Tool Results
          </div>
          <div class="space-y-2">
            {message.content.map((part) => (
              <ExpandablePart
                icon="tool"
                label={`Tool Result: ${part.toolName}`}
                content={
                  <pre class="text-xs whitespace-pre-wrap bg-base-100 p-3 rounded border">
                    {JSON.stringify(part, null, 2)}
                  </pre>
                }
                isError={part.isError}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderUserContent(content: UserContent) {
  if (typeof content === "string") {
    return <div class="text-base-content whitespace-pre-wrap">{content}</div>;
  }
  // Handle array of TextPart | ImagePart | FilePart
  return (
    <div class="space-y-3">
      {content.map((part) => {
        switch (part.type) {
          case "text":
            return (
              <div class="text-base-content whitespace-pre-wrap">
                {(part as TextPart).text}
              </div>
            );
          case "image":
            // Show image inline
            return (
              <div class="bg-base-100 p-3 rounded border">
                <img
                  src={
                    typeof part.image === "string"
                      ? part.image
                      : part.image.toString()
                  }
                  alt={part.mimeType || "Image"}
                  class="max-w-xs rounded shadow"
                />
              </div>
            );
          case "file":
            return <FileCard part={part} />;
          default:
            return (
              <div class="text-xs text-base-content/50 bg-base-100 p-2 rounded border">
                [Unknown part: {JSON.stringify(part)}]
              </div>
            );
        }
      })}
    </div>
  );
}

function renderAssistantContent(content: AssistantContent) {
  if (typeof content === "string") {
    return <div class="text-base-content whitespace-pre-wrap">{content}</div>;
  }
  // Handle array of TextPart | FilePart | ReasoningPart | RedactedReasoningPart | ToolCallPart
  return (
    <div class="space-y-3">
      {content.map((part) => {
        switch (part.type) {
          case "text":
            return (
              <div class="text-base-content whitespace-pre-wrap">
                {part.text}
              </div>
            );
          case "file":
            return <FileCard part={part} />;
          case "reasoning":
            return (
              <ExpandablePart
                className="bg-base-100 p-3 rounded border"
                icon="thinking"
                label="Model Reasoning"
                content={part.text}
              />
            );
          case "redacted-reasoning":
            return (
              <ExpandablePart
                className="bg-base-100 p-3 rounded border"
                icon="thinking"
                label="Redacted Reasoning"
                content={part.data}
              />
            );
          case "tool-call":
            return (
              <ExpandablePart
                className="bg-base-100 p-3 rounded border"
                icon="tool"
                label={`Tool Call: ${part.toolName}`}
                content={
                  <pre class="text-xs whitespace-pre-wrap">
                    {JSON.stringify(part, null, 2)}
                  </pre>
                }
              />
            );
          default:
            return (
              <div class="text-xs text-base-content/50 bg-base-100 p-2 rounded border">
                [Unknown part: {JSON.stringify(part)}]
              </div>
            );
        }
      })}
    </div>
  );
}

// Expandable/collapsible part for tool calls and reasoning
function ExpandablePart(props: {
  icon: "tool" | "thinking";
  label: string;
  content: any;
  isError?: boolean;
  className?: string;
}) {
  const [open, setOpen] = createSignal(false);
  return (
    <div class={props.className}>
      <div
        class="flex items-center gap-2 cursor-pointer text-xs text-base-content/60"
        onClick={() => setOpen((v) => !v)}
      >
        {props.icon === "tool" ? (
          <ToolIcon class="size-5 shrink-0" />
        ) : (
          <ThinkingIcon class="size-5 shrink-0" />
        )}
        <span class="whitespace-pre">{props.label}</span>
        <span class="ml-auto text-xs">[{open() ? "Hide" : "Show"}]</span>
      </div>
      <Show when={open()}>{props.content}</Show>
    </div>
  );
}

// File card for file parts
function FileCard(props: { part: FilePart }) {
  const { part } = props;
  let url: string | undefined = undefined;
  if (typeof part.data === "string" && part.data.startsWith("data:")) {
    url = part.data;
  } else if (typeof part.data === "string" && part.data.startsWith("http")) {
    url = part.data;
  } else if (part.data instanceof URL) {
    url = part.data.toString();
  } else if (typeof part.data === "string") {
    // Try to guess mime type
    url = `data:${part.mimeType};base64,${part.data}`;
  }
  return (
    <div class="card bg-base-100 shadow border border-base-300 my-2 max-w-xs">
      <div class="card-body p-3">
        <div class="font-semibold text-sm mb-1">{part.filename || "File"}</div>
        <div class="text-xs text-base-content/60 mb-2">{part.mimeType}</div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-xs btn-outline"
          >
            Open File
          </a>
        )}
      </div>
    </div>
  );
}
