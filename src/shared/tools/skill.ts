import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { type InferUITool, tool } from "ai";
import { z } from "zod";
import type { AgentContext } from "../agent/context";
import { type SkillInfo, skillManager } from "../skill";

interface CreateSkillToolOptions {
  context: AgentContext;
  skills: SkillInfo[];
  needsApproval?: boolean;
}

const buildSkillDescription = (skills: SkillInfo[]): string => {
  if (skills.length === 0) {
    return "Load a specialized skill that provides domain-specific instructions and workflows. No skills are currently available.";
  }

  const skillList = skills.map((skill) => `- ${skill.name}: ${skill.description}`).join("\n");

  return [
    "Load a specialized skill that provides domain-specific instructions and workflows.",
    "",
    "When a user task matches one of the available skills, load it to inject detailed instructions and bundled resources into context.",
    "",
    'Tool output includes a `<skill name="...">` block with the loaded content.',
    "",
    "Available skills:",
    skillList,
  ].join("\n");
};

async function buildDirListing(rootDir: string, currentDir: string, depth = 0): Promise<string> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const lines: string[] = [];
  const indent = "  ".repeat(depth);

  for (const entry of entries) {
    if (entry.isDirectory()) {
      lines.push(`${indent}${entry.name}/`);
      const sub = await buildDirListing(rootDir, path.join(currentDir, entry.name), depth + 1);
      if (sub) lines.push(sub);
    } else {
      lines.push(`${indent}${entry.name}`);
    }
  }

  return lines.join("\n");
}

export const createSkillTool = ({ context, skills, needsApproval = true }: CreateSkillToolOptions) =>
  tool({
    description: buildSkillDescription(skills),
    inputSchema: z.object({
      name: z.string().describe("The name of the skill to load"),
      file: z
        .string()
        .optional()
        .describe(
          "Optional path relative to the skill directory. If omitted, loads SKILL.md content. If a file path, returns its content. If a directory path, returns the directory listing."
        ),
    }),
    needsApproval,
    execute: async ({ name, file }) => {
      const skill = skillManager.getByName(name);

      if (!skill) {
        const available = skills.map((item) => item.name).join(", ");
        return {
          title: `Loaded skill: ${name}`,
          output: `Skill "${name}" not found. Available skills: ${available || "none"}`,
        };
      }

      const dir = path.dirname(skill.location);
      const base = pathToFileURL(dir).href;

      if (file) {
        const targetPath = path.resolve(dir, file);
        const relative = path.relative(dir, targetPath);
        if (relative.startsWith("..") || path.isAbsolute(relative)) {
          return {
            title: "Skill file access denied",
            output: `Access denied: "${file}" is outside the skill directory.`,
          };
        }

        let targetStat: Awaited<ReturnType<typeof stat>>;
        try {
          targetStat = await stat(targetPath);
        } catch {
          return {
            title: "Skill file not found",
            output: `File or directory "${file}" not found in skill "${name}".`,
          };
        }

        if (targetStat.isDirectory()) {
          const listing = await buildDirListing(targetPath, targetPath);
          return {
            title: `Skill directory: ${file}`,
            output: [`<skill name="${skill.name}" directory="${file}">`, listing, "</skill>"].join("\n"),
            metadata: { name: skill.name, dir, directory: file },
          };
        }

        const content = await readFile(targetPath, "utf-8");
        return {
          title: `Skill file: ${file}`,
          output: [`<skill name="${skill.name}" file="${file}">`, content.trim(), "</skill>"].join("\n"),
          metadata: { name: skill.name, dir, file },
        };
      }

      return {
        title: `Loaded skill: ${skill.name}`,
        output: [
          `<skill name="${skill.name}" file="SKILL.md">`,
          `# Skill: ${skill.name}`,
          "",
          skill.content.trim(),
          "</skill>",
        ].join("\n"),
        metadata: {
          name: skill.name,
          dir,
          file: "SKILL.md",
        },
      };
    },
    toModelOutput: ({ output }) => {
      return {
        type: "text",
        value: output.output,
      };
    },
  });

export type SkillToolType = InferUITool<ReturnType<typeof createSkillTool>>;
