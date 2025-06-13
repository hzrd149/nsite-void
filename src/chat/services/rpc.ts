import { defer, filter, fromEvent, map, share, shareReplay } from "rxjs";
import type { ClientWorkerCommands } from "../../common/interface";
import { RPCClient } from "../../common/rpc-client";

// Create an rpc client for calling the worker
export const rpcClient = new RPCClient<ClientWorkerCommands>(
  // Listen for messages from the worker
  fromEvent<MessageEvent>(navigator.serviceWorker, "message").pipe(
    // Select the data
    map((event) => event.data),
    // Ensure its an RPC message
    filter((message) => Reflect.has(message, "type")),
    // Only subscribe to events once
    share(),
  ),
  // Send message to the worker
  (message) => navigator.serviceWorker.controller?.postMessage(message),
);

export const config$ = defer(() => rpcClient.call("getConfig", void 0)).pipe(
  shareReplay(1),
);
export const messages$ = defer(() =>
  rpcClient.call("chat.messages", void 0),
).pipe(shareReplay(1));
