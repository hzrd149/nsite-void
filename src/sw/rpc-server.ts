import { filter, fromEvent, share, takeUntil } from "rxjs";
import type {
  ClientWorkerCommands,
  RPCMessage,
  RPCResponseComplete,
} from "../common/interface";
import { RPCServer } from "../common/rpc-server";

export const rpcServer = new RPCServer<ClientWorkerCommands>();

// Create a stream of incoming messages
const messages = fromEvent<MessageEvent>(self, "message").pipe(
  filter((event) => Reflect.has(event.data, "type")),
  share(),
);

// Listen for incoming CALL messages
messages.subscribe((message) => {
  const data = message.data as RPCMessage;

  if (data.type === "CALL") {
    console.log("[RPC] Received call", data.id, data.command, data.payload);

    rpcServer
      .call(data.id, data.command, data.payload)
      .pipe(
        // Close the request when a close message is received
        takeUntil(
          messages.pipe(
            filter((e) => e.data.id === data.id && e.data.type === "CLOSE"),
          ),
        ),
      )
      .subscribe({
        next: (response) => message.source?.postMessage(response),
        // Send the complete message when the request is complete
        complete: () =>
          message.source?.postMessage({
            id: data.id,
            type: "COMPLETE",
          } satisfies RPCResponseComplete),
      });
  }
});
