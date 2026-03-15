import { spawn } from "node:child_process";
import { type InferUITool, tool } from "ai";
import { z } from "zod";

const MAX_OUTPUT_LENGTH = 30_000;
const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000;

const DESCRIPTION = `Execute a shell command in the working directory.
- Output exceeding ${MAX_OUTPUT_LENGTH} characters will be truncated.
- Commands that run longer than the timeout will be terminated.
- Prefer using the workdir parameter over 'cd' commands.`;

export const bashTool = tool({
  description: DESCRIPTION,
  inputSchema: z.object({
    command: z.string().describe("The shell command to execute"),
    timeout: z.number().positive().optional().describe("Optional timeout in milliseconds (default: 2 minutes)"),
    workdir: z
      .string()
      .optional()
      .describe("The working directory to run the command in. Use this instead of 'cd' commands."),
    description: z
      .string()
      .describe(
        "Clear, concise description of what this command does in 5-10 words. Examples:\nInput: ls\nOutput: Lists files in current directory\n\nInput: git status\nOutput: Shows working tree status\n\nInput: npm install\nOutput: Installs package dependencies"
      ),
  }),
  needsApproval: true,
  execute: async ({ command, timeout, workdir, description }, { abortSignal }) => {
    const cwd = workdir ?? process.cwd();
    const resolvedTimeout = timeout ?? DEFAULT_TIMEOUT_MS;

    const proc = spawn(command, {
      shell: true,
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
      windowsHide: process.platform === "win32",
    });

    let output = "";
    let timedOut = false;
    let aborted = false;
    let exited = false;

    const killTree = () => {
      if (exited) return;
      try {
        if (process.platform !== "win32" && proc.pid !== undefined) {
          process.kill(-proc.pid, "SIGTERM");
        } else {
          proc.kill("SIGTERM");
        }
      } catch {
        proc.kill();
      }
    };

    const appendOutput = (chunk: Buffer) => {
      output += chunk.toString();
    };

    proc.stdout?.on("data", appendOutput);
    proc.stderr?.on("data", appendOutput);

    // Handle pre-aborted signal
    if (abortSignal?.aborted) {
      aborted = true;
      killTree();
    }

    const abortHandler = () => {
      aborted = true;
      killTree();
    };

    abortSignal?.addEventListener("abort", abortHandler, { once: true });

    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      killTree();
    }, resolvedTimeout + 100);

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeoutTimer);
        abortSignal?.removeEventListener("abort", abortHandler);
      };

      proc.once("exit", () => {
        exited = true;
        cleanup();
        resolve();
      });

      proc.once("error", (error) => {
        exited = true;
        cleanup();
        reject(error);
      });
    });

    const metaParts: string[] = [];
    if (timedOut) {
      metaParts.push(`bash tool terminated command after exceeding timeout ${resolvedTimeout} ms`);
    }
    if (aborted) {
      metaParts.push("User aborted the command");
    }
    if (metaParts.length > 0) {
      output += `\n\n<bash_metadata>\n${metaParts.join("\n")}\n</bash_metadata>`;
    }

    const truncatedOutput = output.length > MAX_OUTPUT_LENGTH ? `${output.slice(0, MAX_OUTPUT_LENGTH)}\n\n...` : output;

    return {
      title: description,
      output: truncatedOutput,
      exit: proc.exitCode,
    };
  },
});

export type BashToolType = InferUITool<typeof bashTool>;
