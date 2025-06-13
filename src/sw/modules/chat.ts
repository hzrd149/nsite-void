import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type CoreMessage } from "ai";
import { BehaviorSubject, firstValueFrom, map } from "rxjs";
import { logger } from "../../common/logger";
import { rpcServer } from "../rpc-server";
import { config$ } from "./config";

const log = logger.extend("chat");

const openai$ = config$.pipe(
  map((cfg) =>
    createOpenAI({
      baseURL: cfg.apiUrl,
      apiKey: cfg.apiKey,
    }),
  ),
);
const model$ = openai$.pipe(map((openai) => openai("gpt-4o-mini")));

const messages$ = new BehaviorSubject<CoreMessage[]>([]);

function resetConversation() {
  messages$.next([]);
}

async function sendMessage(message: string) {
  const model = await firstValueFrom(model$);

  log("Sending message", message);
  messages$.next([...messages$.value, { role: "user", content: message }]);

  const m = await generateText({
    model,
    system: "You are a helpful assistant.",
    messages: messages$.value,
  });

  // Add the message to the conversation
  messages$.next([...messages$.value, { role: "assistant", content: m.text }]);
}

// RPC methods
rpcServer.register("chat.message", sendMessage);
rpcServer.register("chat.messages", () => messages$);
rpcServer.register("chat.reset", resetConversation);
