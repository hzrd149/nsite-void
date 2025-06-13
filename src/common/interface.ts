import type { Observable } from "rxjs";
import type { AppConfig } from "./types";
import type { CoreMessage } from "ai";

// Base RPC message types
export type RPCMessageCall<T extends unknown = any> = {
  id: string;
  type: "CALL";
  command: string;
  payload: T;
};
export type RPCMessageClose = {
  id: string;
  type: "CLOSE";
};

// Base RPC response types
export type RPCResponseError = {
  type: "ERROR";
  id: string;
  error: string;
};
export type RPCResponseResult<T extends unknown = any> = {
  type: "RESULT";
  id: string;
  value: T;
};
export type RPCResponseComplete = {
  type: "COMPLETE";
  id: string;
};

export type RPCMessage<T extends unknown = any> =
  | RPCMessageCall<T>
  | RPCMessageClose;
export type RPCResponse<T extends unknown = any> =
  | RPCResponseError
  | RPCResponseResult<T>
  | RPCResponseComplete;

// A directory of RPC commands
export type RPCCommandDirectory = {
  [command: string]: {
    payload: any;
    result: any;
  };
};

// RPC handler function type
export type RPCHandler<
  TPayload extends unknown = any,
  TResult extends unknown = any,
> = (
  payload: TPayload,
) =>
  | Observable<TResult>
  | Promise<TResult>
  | Promise<Observable<TResult>>
  | TResult;

// Registry for RPC handlers
export type RPCHandlerRegistry<Commands extends RPCCommandDirectory = {}> = {
  [command in keyof Commands]: RPCHandler<
    Commands[command]["payload"],
    Commands[command]["result"]
  >;
};

// Commands for the client to send to the worker
export interface ClientWorkerCommands extends RPCCommandDirectory {
  getConfig: {
    payload: void;
    result: AppConfig;
  };
  setConfig: {
    payload: Partial<AppConfig>;
    result: AppConfig;
  };
  resetConfig: {
    payload: void;
    result: AppConfig;
  };

  // File operations
  "file.add": {
    payload: { url: string; blob: Blob };
    result: { url: string };
  };
  "file.addData": {
    payload: {
      url: string;
      data: string | ArrayBuffer | Uint8Array;
      mimeType?: string;
    };
    result: { url: string };
  };
  "file.remove": {
    payload: { url: string };
    result: { url: string };
  };
  "file.list": {
    payload: void;
    result: { files: string[] };
  };
  "file.clear": {
    payload: void;
    result: void;
  };

  // Chat operations
  "chat.message": {
    payload: string;
    result: void;
  };
  "chat.messages": {
    payload: void;
    result: CoreMessage[];
  };
  "chat.reset": {
    payload: void;
    result: void;
  };
}

// Commands for the worker to send to the client
export interface WorkerClientCommands {
  "worker.ping": {
    payload: void;
    result: { pong: boolean };
  };
}
