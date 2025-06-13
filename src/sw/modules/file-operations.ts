import { rpcServer } from "../rpc-server";

// Store for custom files (moved from main index)
const customFiles: Record<string, Blob> = {};

// Helper function to normalize URL for matching
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search + urlObj.hash;
  } catch {
    return url;
  }
}

// Register file operation handlers
export function registerFileOperations() {
  // Add file from blob
  rpcServer.register(
    "file.add",
    async (payload: { url: string; blob: Blob }) => {
      const { url, blob } = payload;
      if (!url || !blob) {
        throw new Error("URL and blob are required");
      }

      const normalizedUrl = normalizeUrl(url);
      customFiles[normalizedUrl] = blob;
      console.log("Added custom file:", normalizedUrl);

      return { url: normalizedUrl };
    },
  );

  // Add file from data
  rpcServer.register(
    "file.addData",
    async (payload: {
      url: string;
      data: string | ArrayBuffer | Uint8Array;
      mimeType?: string;
    }) => {
      const { url, data, mimeType } = payload;
      if (!url || !data) {
        throw new Error("URL and data are required");
      }

      const normalizedUrl = normalizeUrl(url);
      const blob = new Blob([data as BlobPart], {
        type: mimeType || "application/octet-stream",
      });
      customFiles[normalizedUrl] = blob;
      console.log("Added custom file from data:", normalizedUrl);

      return { url: normalizedUrl };
    },
  );

  // Remove file
  rpcServer.register("file.remove", async (payload: { url: string }) => {
    const { url } = payload;
    if (!url) {
      throw new Error("URL is required");
    }

    const normalizedUrl = normalizeUrl(url);
    delete customFiles[normalizedUrl];
    console.log("Removed custom file:", normalizedUrl);

    return { url: normalizedUrl };
  });

  // List files
  rpcServer.register("file.list", async () => {
    const files = Object.keys(customFiles);
    console.log("Listing custom files:", files);
    return { files };
  });

  // Get file (for internal use by fetch handler)
  rpcServer.register("file.get", async (payload: { url: string }) => {
    const { url } = payload;
    const normalizedUrl = normalizeUrl(url);
    const blob = customFiles[normalizedUrl];
    return blob ? { blob, exists: true } : { exists: false };
  });
}

// Export the customFiles for use in fetch handler
export { customFiles };
