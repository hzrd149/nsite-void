import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type CoreMessage } from "ai";
import { BehaviorSubject, firstValueFrom, map, switchMap } from "rxjs";

import { logger } from "../common/logger";
import { config$ } from "./config";
import { SYSTEM_PROMPT } from "./const";
import { rpcServer } from "./rpc-server";
import fsTools from "./tools";
import { saveMessages, loadMessages, clearMessages } from "./db";

const log = logger.extend("chat");

const openai$ = config$.pipe(
  map((cfg) =>
    createOpenAI({
      baseURL: cfg.apiUrl,
      apiKey: cfg.apiKey,
    }),
  ),
);
const model$ = config$.pipe(
  map((cfg) =>
    openai$.pipe(map((openai) => openai(cfg.model || "claude-sonnet-4"))),
  ),
  switchMap((x) => x),
);

const messages$ = new BehaviorSubject<CoreMessage[]>([]);
const isLoading$ = new BehaviorSubject<boolean>(false);

// Load messages from database on initialization
async function initializeMessages() {
  try {
    const persistedMessages = await loadMessages();
    if (persistedMessages.length > 0) {
      messages$.next(persistedMessages);
      log("Loaded", persistedMessages.length, "messages from database");
    }
  } catch (error) {
    log("Error loading messages from database:", error);
  }
}

// Initialize messages when the module loads
initializeMessages();

async function updateMessages(newMessages: CoreMessage[]) {
  messages$.next(newMessages);
  try {
    await saveMessages(newMessages);
    log("Saved", newMessages.length, "messages to database");
  } catch (error) {
    log("Error saving messages to database:", error);
  }
}

async function resetConversation() {
  await updateMessages([]);
  try {
    await clearMessages();
    log("Cleared messages from database");
  } catch (error) {
    log("Error clearing messages from database:", error);
  }
  isLoading$.next(false);
}

async function sendMessage(message: string) {
  const model = await firstValueFrom(model$);
  const config = await firstValueFrom(config$);

  log("Sending message", message);
  const currentMessages: CoreMessage[] = [
    ...messages$.value,
    { role: "user", content: message } as CoreMessage,
  ];
  await updateMessages(currentMessages);

  // Set loading state to true
  isLoading$.next(true);

  try {
    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      tools: fsTools,
      messages: messages$.value,
      maxSteps: config.maxSteps,
    });

    // Add all generated messages (including tool calls/results) to the conversation
    const updatedMessages = [...messages$.value, ...result.response.messages];
    await updateMessages(updatedMessages);
  } finally {
    // Always set loading state to false when done
    isLoading$.next(false);
  }
}

// RPC methods
rpcServer.register("chat.message", sendMessage);
rpcServer.register("chat.messages", () => messages$);
rpcServer.register("chat.reset", resetConversation);
rpcServer.register("chat.isLoading", () => isLoading$);
