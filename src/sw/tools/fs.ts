import FS from "@isomorphic-git/lightning-fs";
import { tool, type ToolSet } from "ai";
import z from "zod";
import { logger } from "../../common/logger";

const fs = new FS("fs");
const pfs = fs.promises;

const log = logger.extend("fs");

const pathSchema = z
  .string()
  .describe("The absolute path to the file.")
  .transform((path) => (path.startsWith("/") ? path : `/${path}`));

const readFile = tool({
  description:
    "Read a file from the virtual file system. Returns a string if encoding is 'utf8', otherwise a Uint8Array.",
  parameters: z.object({
    path: pathSchema,
    encoding: z.enum(["utf8"]).optional(),
  }),
  execute: async ({ path, encoding }) => {
    log("readFile", path, encoding);
    return await pfs.readFile(path, encoding ? { encoding } : undefined);
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
    log("writeFile", path, encoding);
    const options: any = {};
    if (encoding !== undefined) options.encoding = encoding;
    await pfs.writeFile(
      path,
      data,
      Object.keys(options).length ? options : undefined,
    );
    return { success: true };
  },
});

const unlink = tool({
  description: "Delete a file from the virtual file system.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    log("unlink", path);
    await pfs.unlink(path);
    return { success: true };
  },
});

const readdir = tool({
  description: "List files and directories in a directory.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    log("readdir", path);
    return await pfs.readdir(path);
  },
});

const mkdir = tool({
  description: "Create a new directory.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    log("mkdir", path);
    await pfs.mkdir(path);
    return { success: true };
  },
});

const rmdir = tool({
  description: "Remove a directory.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    log("rmdir", path);
    await pfs.rmdir(path);
    return { success: true };
  },
});

const stat = tool({
  description: "Get file or directory statistics.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    log("stat", path);
    return await pfs.stat(path);
  },
});

const lstat = tool({
  description: "Get file or symlink statistics (does not follow symlinks).",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    log("lstat", path);
    return await pfs.lstat(path);
  },
});

const rename = tool({
  description: "Rename a file or directory.",
  parameters: z.object({
    oldPath: pathSchema.describe("The absolute path of the file to rename."),
    newPath: pathSchema.describe("The absolute path of the new file name."),
  }),
  execute: async ({ oldPath, newPath }) => {
    log("rename", oldPath, newPath);
    await pfs.rename(oldPath, newPath);
    return { success: true };
  },
});

const symlink = tool({
  description: "Create a symbolic link.",
  parameters: z.object({
    target: z.string(),
    path: pathSchema,
  }),
  execute: async ({ target, path }) => {
    log("symlink", target, path);
    await pfs.symlink(target, path);
    return { success: true };
  },
});

const readlink = tool({
  description: "Read the target of a symbolic link.",
  parameters: z.object({
    path: pathSchema,
  }),
  execute: async ({ path }) => {
    log("readlink", path);
    return await pfs.readlink(path);
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
