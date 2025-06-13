import mime from "mime";
import pfs from "./fs";

// Type guard for FetchEvent (for TypeScript)
function isFetchEvent(event: Event): event is FetchEvent {
  return typeof FetchEvent !== "undefined" && event instanceof FetchEvent;
}

// Register fetch event handler
self.addEventListener("fetch", (event) => {
  if (!isFetchEvent(event)) return;

  const url = new URL(event.request.url);

  event.respondWith(
    (async () => {
      let fsPath = url.pathname;
      if (fsPath.endsWith("/")) fsPath = fsPath.slice(0, -1);
      if (fsPath === "") fsPath = "/";
      try {
        // Try to stat the path
        let stat;
        try {
          stat = await pfs.stat(fsPath);
        } catch (err) {
          // Not found, fallback to network
          return fetch(event.request).catch(
            () =>
              new Response("Network error", {
                status: 503,
                statusText: "Service Unavailable",
              }),
          );
        }

        // If it's a directory, look for index.html
        if (stat.isDirectory()) {
          let indexPath = fsPath.endsWith("/")
            ? fsPath + "index.html"
            : fsPath + "/index.html";
          try {
            const indexStat = await pfs.stat(indexPath);
            if (indexStat.isFile()) {
              const data = (await pfs.readFile(
                indexPath,
              )) as Uint8Array<ArrayBuffer>;
              const mimeType =
                mime.getType(indexPath) || "application/octet-stream";
              const blob = new Blob([data], { type: mimeType });
              return new Response(blob, {
                status: 200,
                statusText: "OK",
                headers: {
                  "Content-Type": mimeType,
                  "Cache-Control": "no-cache",
                },
              });
            }
          } catch (err) {
            // index.html not found, fallback to network
            return fetch(event.request).catch(
              () =>
                new Response("Network error", {
                  status: 503,
                  statusText: "Service Unavailable",
                }),
            );
          }
        }

        // If it's a file, serve it
        if (stat.isFile()) {
          const data = (await pfs.readFile(fsPath)) as Uint8Array<ArrayBuffer>;
          const mimeType = mime.getType(fsPath) || "application/octet-stream";
          const blob = new Blob([data], { type: mimeType });
          return new Response(blob, {
            status: 200,
            statusText: "OK",
            headers: {
              "Content-Type": mimeType,
              "Cache-Control": "no-cache",
            },
          });
        }

        // If neither, fallback to network
        return fetch(event.request).catch(
          () =>
            new Response("Network error", {
              status: 503,
              statusText: "Service Unavailable",
            }),
        );
      } catch (err) {
        // Fallback to network
        return fetch(event.request).catch(
          () =>
            new Response("Network error", {
              status: 503,
              statusText: "Service Unavailable",
            }),
        );
      }
    })(),
  );
});
