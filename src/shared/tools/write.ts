import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { type InferUITool, tool } from "ai";
import { z } from "zod";

const DESCRIPTION = `Write full content to a file. Creates the file if it doesn't exist, overwrites if it does. Automatically creates parent directories.
- filePath can be absolute or relative to the current working directory.
- Existing file content will be replaced completely.`;

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const writeTool = tool({
  description: DESCRIPTION,
  inputSchema: z.object({
    content: z.string().describe("The full content to write into the target file"),
    filePath: z
      .string()
      .describe("Absolute path preferred. Relative paths are resolved from current working directory."),
  }),
  needsApproval: true,
  execute: async ({ content, filePath }) => {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    const existed = await fileExists(absolutePath);
    if (!existed) {
      await mkdir(path.dirname(absolutePath), { recursive: true });
    }
    await writeFile(absolutePath, content, "utf8");

    const relativePath = path.relative(process.cwd(), absolutePath);

    return {
      title: relativePath,
      output: "Wrote file successfully.",
    };
  },
});

export type WriteToolType = InferUITool<typeof writeTool>;
