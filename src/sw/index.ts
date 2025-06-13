/// <reference lib="webworker" />

import debug from "debug";
import { logger } from "../common/logger";
import "./server";
import { rpcServer } from "./rpc-server";

import "./chat";
import "./config";

// Enable all debug logs in the service worker
debug.enable("void:*");

const log = logger.extend("worker");

// Service Worker for custom file serving with RPC support
declare var self: ServiceWorkerGlobalScope;

// Install event - activate immediately
self.addEventListener("install", (event) => {
  log("Service Worker installing...");
  event.waitUntil(self.skipWaiting());
});

// Activate event - claim clients immediately and register modules
self.addEventListener("activate", (event) => {
  log("Service Worker activating...");

  log("Registered RPC commands:", rpcServer.getRegisteredCommands());
  event.waitUntil(self.clients.claim());
});
