import { generateText, type InferUITool, stepCountIs, tool } from "ai";
import { z } from "zod";
import type { AgentContext } from "../agent/context";

type ToolSet = NonNullable<Parameters<typeof generateText>[0]["tools"]>;
type GenerateTextModel = Parameters<typeof generateText>[0]["model"];

const SUBAGENT_MAX_STEPS = 30;

const DESCRIPTION = `Spawn a subagent with fresh context. The subagent only receives this task prompt and can use tools to complete it.
- Parent conversation history is not forwarded to the subagent.
- The subagent returns a concise summary only.
- This tool may run multiple child tool calls automatically.`;

interface CreateTaskToolProps {
  context: AgentContext;
  model: GenerateTextModel;
  childTools: ToolSet;
}

const createSubagentSystemPrompt = (workdir: string): string =>
  `You are a subagent at ${workdir}. Complete the given task, then summarize your findings.`;

export const createTaskTool = ({ context, model, childTools }: CreateTaskToolProps) =>
  tool({
    description: DESCRIPTION,
    inputSchema: z.object({
      prompt: z.string().describe("Detailed instruction for the subagent to execute"),
      description: z.string().optional().describe("Short description of the delegated task"),
    }),
    needsApproval: true,
    execute: async ({ prompt, description }, { experimental_context }) => {
      const parentContext = (experimental_context as AgentContext | undefined) ?? context;
      const childContext: AgentContext = {
        workdir: parentContext.workdir,
        homedir: parentContext.homedir,
      };

      const { text } = await generateText({
        model,
        system: createSubagentSystemPrompt(childContext.workdir),
        prompt,
        tools: childTools,
        stopWhen: stepCountIs(SUBAGENT_MAX_STEPS),
        experimental_context: childContext,
      });

      return {
        title: description ?? "subagent task",
        output: text || "(no summary)",
      };
    },
    toModelOutput: ({ output }) => {
      return {
        type: "text",
        value: output.output,
      };
    },
  });

export type TaskToolType = InferUITool<ReturnType<typeof createTaskTool>>;
