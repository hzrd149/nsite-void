/// <reference lib="webworker" />

import debug from "debug";
import mime from "mime";
import { logger } from "../common/logger";
import { customFiles } from "./modules/file-operations";
import { rpcServer } from "./rpc-server";

import "./modules/chat";
import "./modules/config";
import "./modules/file-operations";

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

// Helper function to normalize URL for matching (used by fetch handler)
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search + urlObj.hash;
  } catch {
    return url;
  }
}

// Fetch event handler
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  const normalizedUrl = normalizeUrl(url);

  log("Service Worker intercepting:", url);

  // Check if we have a custom file for this URL
  if (customFiles[normalizedUrl]) {
    log("Serving custom file for:", normalizedUrl);

    const blob = customFiles[normalizedUrl];
    const mimeType = mime.getType(normalizedUrl) || "application/octet-stream";

    const response = new Response(blob, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": blob.size.toString(),
        "Cache-Control": "no-cache",
      },
    });

    event.respondWith(Promise.resolve(response));
    return;
  }

  // Forward to network if no custom file found
  log("Forwarding to network:", url);
  event.respondWith(
    fetch(event.request).catch((error) => {
      log("Network request failed:", error);
      return new Response("Network error", {
        status: 503,
        statusText: "Service Unavailable",
      });
    }),
  );
});
