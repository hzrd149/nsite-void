import {
  filter,
  fromEvent,
  map,
  share,
  shareReplay,
  switchMap,
  type Observable,
} from "rxjs";
import type {
  ClientWorkerCommands,
  RPCCommandDirectory,
} from "../../common/interface";
import { RPCClient } from "../../common/rpc-client";
import { container$ } from "./service-worker";

// Create an rpc client for calling the worker
export const rpcClient$ = container$.pipe(
  map(
    (container) =>
      new RPCClient<ClientWorkerCommands>(
        // Listen for messages from the worker
        fromEvent<MessageEvent>(container, "message").pipe(
          // Select the data
          map((event) => event.data),
          // Ensure its an RPC message
          filter((message) => Reflect.has(message, "type")),
          // Only subscribe to events once
          share(),
        ),
        // Send message to the worker
        (message) => container.controller?.postMessage(message),
      ),
  ),
  // Share the rpc client so it can be used by multiple subscribers
  shareReplay(1),
);

type Methods<Commands extends RPCCommandDirectory> = {
  [command in keyof Commands]: (
    payload: Commands[command]["payload"],
  ) => Observable<Commands[command]["result"]>;
};

// Quick methods for RPC client
export const rpc: Methods<ClientWorkerCommands> = {
  getConfig: () =>
    rpcClient$.pipe(switchMap((client) => client.call("getConfig", void 0))),
  setConfig: (payload) =>
    rpcClient$.pipe(switchMap((client) => client.call("setConfig", payload))),
  resetConfig: () =>
    rpcClient$.pipe(switchMap((client) => client.call("resetConfig", void 0))),
  "file.add": (payload) =>
    rpcClient$.pipe(switchMap((client) => client.call("file.add", payload))),
  "file.addData": (payload) =>
    rpcClient$.pipe(
      switchMap((client) => client.call("file.addData", payload)),
    ),
  "file.remove": (payload) =>
    rpcClient$.pipe(switchMap((client) => client.call("file.remove", payload))),
  "file.list": () =>
    rpcClient$.pipe(switchMap((client) => client.call("file.list", void 0))),
  "file.clear": () =>
    rpcClient$.pipe(switchMap((client) => client.call("file.clear", void 0))),
  "file.get": (payload) =>
    rpcClient$.pipe(switchMap((client) => client.call("file.get", payload))),
};
