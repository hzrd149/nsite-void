import FS from "@isomorphic-git/lightning-fs";
import { of } from "rxjs";
import { rpcServer } from "./rpc-server";
import { logger } from "../common/logger";

const log = logger.extend("fs");

const fs = new FS("fs");
const pfs = fs.promises;

// Register RPC method to clear all local files
rpcServer.register("fs.clear", async () => {
  try {
    // Use Lightning FS's built-in wipe functionality by re-initializing with wipe: true
    await fs.init("fs", { wipe: true });

    log("File system cleared successfully");
    return of(void 0);
  } catch (error) {
    log("Failed to clear file system:", error);
    throw error;
  }
});

export default pfs;
