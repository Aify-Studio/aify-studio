import { createReadStream } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createInterface } from "node:readline";
import { type InferUITool, tool } from "ai";
import { z } from "zod";
import type { AgentContext } from "../agent/context";

const DEFAULT_READ_LIMIT = 2000;
const MAX_LINE_LENGTH = 2000;
const MAX_LINE_SUFFIX = `... (line truncated to ${MAX_LINE_LENGTH} chars)`;
const MAX_BYTES = 50 * 1024;
const MAX_BYTES_LABEL = `${MAX_BYTES / 1024} KB`;

const DESCRIPTION = `Read files or directories from the local workspace.
- filePath supports absolute and relative paths.
- offset is 1-indexed and defaults to 1.
- limit defaults to ${DEFAULT_READ_LIMIT} lines/entries.
- Output is truncated at ${MAX_BYTES_LABEL}.`;

type Stat = Awaited<ReturnType<typeof fs.stat>>;

export const readTool = tool({
  description: DESCRIPTION,
  inputSchema: z.object({
    filePath: z.string().describe("Absolute or relative file/directory path to read"),
    offset: z.coerce.number().int().positive().optional().describe("Start line/entry number (1-indexed)"),
    limit: z.coerce.number().int().positive().optional().describe("Maximum lines/entries to read"),
  }),
  needsApproval: true,
  execute: async ({ filePath, offset, limit }, { experimental_context }) => {
    const context = experimental_context as AgentContext;
    const cwd = context.workdir;
    const normalizedOffset = offset ?? 1;
    const normalizedLimit = limit ?? DEFAULT_READ_LIMIT;

    const resolvedPath = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(cwd, filePath);
    const stat = await safeStat(resolvedPath);

    if (!stat) {
      const suggestions = await findPathSuggestions(resolvedPath);
      if (suggestions.length > 0) {
        throw new Error(`Path not found: ${resolvedPath}\n\nDid you mean:\n${suggestions.join("\n")}`);
      }
      throw new Error(`Path not found: ${resolvedPath}`);
    }

    if (stat.isDirectory()) {
      const output = await readDirectory({
        directoryPath: resolvedPath,
        offset: normalizedOffset,
        limit: normalizedLimit,
      });

      return {
        title: path.relative(cwd, resolvedPath) || resolvedPath,
        output,
      };
    }

    const isBinary = await isBinaryFile(resolvedPath, Number(stat.size));
    if (isBinary) {
      throw new Error(`Cannot read binary file: ${resolvedPath}`);
    }

    const output = await readTextFile({
      filePath: resolvedPath,
      offset: normalizedOffset,
      limit: normalizedLimit,
    });

    return {
      title: path.relative(process.cwd(), resolvedPath) || resolvedPath,
      output,
    };
  },
  toModelOutput: ({ output }) => {
    return {
      type: "text",
      value: output.output,
    };
  },
});

type ReadDirectoryParams = {
  directoryPath: string;
  offset: number;
  limit: number;
};

async function readDirectory({ directoryPath, offset, limit }: ReadDirectoryParams): Promise<string> {
  const dirents = await fs.readdir(directoryPath, { withFileTypes: true });
  const entries = await Promise.all(
    dirents.map(async (dirent) => {
      if (dirent.isDirectory()) {
        return `${dirent.name}/`;
      }

      if (dirent.isSymbolicLink()) {
        const target = await fs.stat(path.join(directoryPath, dirent.name)).catch(() => null);
        if (target?.isDirectory()) {
          return `${dirent.name}/`;
        }
      }

      return dirent.name;
    })
  );

  entries.sort((a, b) => a.localeCompare(b));

  const start = offset - 1;
  const sliced = entries.slice(start, start + limit);
  const truncated = start + sliced.length < entries.length;

  return [
    `<path>${directoryPath}</path>`,
    "<type>directory</type>",
    "<entries>",
    sliced.join("\n"),
    truncated
      ? `\n(Showing ${sliced.length} of ${entries.length} entries. Use offset=${offset + sliced.length} to continue.)`
      : `\n(${entries.length} entries)`,
    "</entries>",
  ].join("\n");
}

type ReadTextFileParams = {
  filePath: string;
  offset: number;
  limit: number;
};

async function readTextFile({ filePath, offset, limit }: ReadTextFileParams): Promise<string> {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({
    input: stream,
    crlfDelay: Number.POSITIVE_INFINITY,
  });

  const start = offset - 1;
  const lines: string[] = [];
  let bytes = 0;
  let totalLines = 0;
  let truncatedByBytes = false;
  let hasMoreLines = false;

  try {
    for await (const rawText of rl) {
      totalLines += 1;
      if (totalLines <= start) {
        continue;
      }

      if (lines.length >= limit) {
        hasMoreLines = true;
        continue;
      }

      const line =
        rawText.length > MAX_LINE_LENGTH ? `${rawText.slice(0, MAX_LINE_LENGTH)}${MAX_LINE_SUFFIX}` : rawText;
      const size = Buffer.byteLength(line, "utf-8") + (lines.length > 0 ? 1 : 0);

      if (bytes + size > MAX_BYTES) {
        truncatedByBytes = true;
        hasMoreLines = true;
        break;
      }

      lines.push(line);
      bytes += size;
    }
  } finally {
    rl.close();
    stream.destroy();
  }

  if (totalLines < offset && !(totalLines === 0 && offset === 1)) {
    throw new Error(`Offset ${offset} is out of range for this file (${totalLines} lines)`);
  }

  const numbered = lines.map((line, index) => `${index + offset}: ${line}`);
  const lastReadLine = offset + lines.length - 1;
  const nextOffset = lastReadLine + 1;
  const output = [
    `<path>${filePath}</path>`,
    "<type>file</type>",
    "<content>",
    numbered.join("\n"),
    truncatedByBytes
      ? `\n\n(Output capped at ${MAX_BYTES_LABEL}. Showing lines ${offset}-${lastReadLine}. Use offset=${nextOffset} to continue.)`
      : hasMoreLines
        ? `\n\n(Showing lines ${offset}-${lastReadLine} of ${totalLines}. Use offset=${nextOffset} to continue.)`
        : `\n\n(End of file - total ${totalLines} lines)`,
    "</content>",
  ].join("\n");

  return output;
}

async function findPathSuggestions(filePath: string): Promise<string[]> {
  const directory = path.dirname(filePath);
  const basename = path.basename(filePath).toLowerCase();
  const entries = await fs.readdir(directory).catch(() => [] as string[]);

  return entries
    .filter((entry) => {
      const lowered = entry.toLowerCase();
      return lowered.includes(basename) || basename.includes(lowered);
    })
    .slice(0, 3)
    .map((entry) => path.join(directory, entry));
}

async function safeStat(filePath: string): Promise<Stat | null> {
  return await fs.stat(filePath).catch(() => null);
}

async function isBinaryFile(filePath: string, fileSize: number): Promise<boolean> {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".zip":
    case ".tar":
    case ".gz":
    case ".exe":
    case ".dll":
    case ".so":
    case ".class":
    case ".jar":
    case ".war":
    case ".7z":
    case ".doc":
    case ".docx":
    case ".xls":
    case ".xlsx":
    case ".ppt":
    case ".pptx":
    case ".odt":
    case ".ods":
    case ".odp":
    case ".bin":
    case ".dat":
    case ".obj":
    case ".o":
    case ".a":
    case ".lib":
    case ".wasm":
    case ".pyc":
    case ".pyo":
      return true;
    default:
      break;
  }

  if (fileSize === 0) {
    return false;
  }

  const fileHandle = await fs.open(filePath, "r");
  try {
    const sampleSize = Math.min(4096, fileSize);
    const bytes = Buffer.alloc(sampleSize);
    const result = await fileHandle.read(bytes, 0, sampleSize, 0);

    if (result.bytesRead === 0) {
      return false;
    }

    let nonPrintableCount = 0;
    for (let index = 0; index < result.bytesRead; index += 1) {
      if (bytes[index] === 0) {
        return true;
      }

      if (bytes[index] < 9 || (bytes[index] > 13 && bytes[index] < 32)) {
        nonPrintableCount += 1;
      }
    }

    return nonPrintableCount / result.bytesRead > 0.3;
  } finally {
    await fileHandle.close();
  }
}

export type ReadToolType = InferUITool<typeof readTool>;
