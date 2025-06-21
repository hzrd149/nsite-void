import { tool, type ToolSet } from "ai";
import z from "zod";
import { logger } from "../common/logger";
import pfs from "./fs";

const log = logger.extend("fs");

const pathSchema = z
  .string()
  .describe("The absolute path to the file.")
  .transform((path) => (path.startsWith("/") ? path : `/${path}`));

// Helper function to create consistent error responses
const createErrorResponse = (
  operation: string,
  path: string,
  error: unknown,
) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  log(`${operation} failed for path ${path}:`, errorMessage);

  return {
    success: false,
    error: `Failed to ${operation} '${path}': ${errorMessage}`,
    operation,
    path,
  };
};

const readFile = tool({
  description:
    "Read a file from the virtual file system. Returns a string if encoding is 'utf8', otherwise a Uint8Array.",
  parameters: z.object({
    path: pathSchema,
    encoding: z.enum(["utf8"]).optional(),
  }),
  execute: async ({ path, encoding }) => {
    try {
      log("readFile", path, encoding);
      const content = await pfs.readFile(
        path,
        encoding ? { encoding } : undefined,
      );
      return {
        success: true,
        content,
        path,
        encoding: encoding || "binary",
      };
    } catch (error) {
      return createErrorResponse("read file", path, error);
    }
  },
});

const writeFile = tool({
  description:
    "Write data to a file in the virtual file system. Data can be a string or Uint8Array.",
  parameters: z.object({
    path: pathSchema,
    data: z.union([z.string(), z.instanceof(Uint8Array)]),
    encoding: z.enum(["utf8"]).optional(),
  }),
  execute: async ({ path, data, encoding }) => {
    try {
      log("writeFile", path, encoding);
      const options: any = {};
      if (encoding !== undefined) options.encoding = encoding;
      await pfs.writeFile(
        path,
        data,
        Object.keys(options).length ? options : undefined,
      );
      return {
        success: true,
        path,
        bytesWritten: data instanceof Uint8Array ? data.length : data.length,
        encoding: encoding || "binary",
      };
    } catch (error) {
      return createErrorResponse("write file", path, error);
    }
  },
});

const unlink = tool({
  description: "Delete a file from the virtual file system.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    try {
      log("unlink", path);
      await pfs.unlink(path);
      return {
        success: true,
        path,
        message: `File '${path}' has been deleted successfully`,
      };
    } catch (error) {
      return createErrorResponse("delete file", path, error);
    }
  },
});

const readdir = tool({
  description: "List files and directories in a directory.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    try {
      log("readdir", path);
      const entries = await pfs.readdir(path);
      return {
        success: true,
        path,
        entries,
        count: entries.length,
      };
    } catch (error) {
      return createErrorResponse("read directory", path, error);
    }
  },
});

const mkdir = tool({
  description: "Create a new directory.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    try {
      log("mkdir", path);
      await pfs.mkdir(path);
      return {
        success: true,
        path,
        message: `Directory '${path}' has been created successfully`,
      };
    } catch (error) {
      return createErrorResponse("create directory", path, error);
    }
  },
});

const rmdir = tool({
  description: "Remove a directory.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    try {
      log("rmdir", path);
      await pfs.rmdir(path);
      return {
        success: true,
        path,
        message: `Directory '${path}' has been removed successfully`,
      };
    } catch (error) {
      return createErrorResponse("remove directory", path, error);
    }
  },
});

const stat = tool({
  description: "Get file or directory statistics.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    try {
      log("stat", path);
      const stats = await pfs.stat(path);
      return {
        success: true,
        path,
        stats,
      };
    } catch (error) {
      return createErrorResponse("get file statistics", path, error);
    }
  },
});

const lstat = tool({
  description: "Get file or symlink statistics (does not follow symlinks).",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    try {
      log("lstat", path);
      const stats = await pfs.lstat(path);
      return {
        success: true,
        path,
        stats,
      };
    } catch (error) {
      return createErrorResponse("get link statistics", path, error);
    }
  },
});

const rename = tool({
  description: "Rename a file or directory.",
  parameters: z.object({
    oldPath: pathSchema.describe("The absolute path of the file to rename."),
    newPath: pathSchema.describe("The absolute path of the new file name."),
  }),
  execute: async ({ oldPath, newPath }) => {
    try {
      log("rename", oldPath, newPath);
      await pfs.rename(oldPath, newPath);
      return {
        success: true,
        oldPath,
        newPath,
        message: `Successfully renamed '${oldPath}' to '${newPath}'`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log(`rename failed from ${oldPath} to ${newPath}:`, errorMessage);
      return {
        success: false,
        error: `Failed to rename '${oldPath}' to '${newPath}': ${errorMessage}`,
        operation: "rename",
        oldPath,
        newPath,
      };
    }
  },
});

const symlink = tool({
  description: "Create a symbolic link.",
  parameters: z.object({
    target: z
      .string()
      .describe("The target path that the symlink should point to"),
    path: pathSchema.describe(
      "The absolute path where the symlink should be created",
    ),
  }),
  execute: async ({ target, path }) => {
    try {
      log("symlink", target, path);
      await pfs.symlink(target, path);
      return {
        success: true,
        target,
        path,
        message: `Successfully created symlink '${path}' pointing to '${target}'`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log(`symlink failed from ${target} to ${path}:`, errorMessage);
      return {
        success: false,
        error: `Failed to create symlink '${path}' pointing to '${target}': ${errorMessage}`,
        operation: "create symlink",
        target,
        path,
      };
    }
  },
});

const readlink = tool({
  description: "Read the target of a symbolic link.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    try {
      log("readlink", path);
      const target = await pfs.readlink(path);
      return {
        success: true,
        path,
        target,
      };
    } catch (error) {
      return createErrorResponse("read symlink", path, error);
    }
  },
});

const fsTools: ToolSet = {
  readFile,
  writeFile,
  unlink,
  readdir,
  mkdir,
  rmdir,
  stat,
  lstat,
  rename,
  symlink,
  readlink,
} as const;

export default fsTools;
