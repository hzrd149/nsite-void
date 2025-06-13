import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type CoreMessage } from "ai";
import { BehaviorSubject, firstValueFrom, map, switchMap } from "rxjs";

import { logger } from "../common/logger";
import { config$ } from "./config";
import { SYSTEM_PROMPT } from "./const";
import { rpcServer } from "./rpc-server";
import fsTools from "./tools";

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

function resetConversation() {
  messages$.next([]);
}

async function sendMessage(message: string) {
  const model = await firstValueFrom(model$);
  const config = await firstValueFrom(config$);

  log("Sending message", message);
  messages$.next([...messages$.value, { role: "user", content: message }]);

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    tools: fsTools,
    messages: messages$.value,
    maxSteps: config.maxSteps,
  });

  // Add all generated messages (including tool calls/results) to the conversation
  messages$.next([...messages$.value, ...result.response.messages]);
}

// RPC methods
rpcServer.register("chat.message", sendMessage);
rpcServer.register("chat.messages", () => messages$);
rpcServer.register("chat.reset", resetConversation);
