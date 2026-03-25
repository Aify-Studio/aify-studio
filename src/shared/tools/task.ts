import { homedir } from "node:os";
import path from "node:path";
import { type InferUITool, tool } from "ai";
import { z } from "zod";
import type { AgentContext } from "../agent/context";
import { readJsonLines, writeJsonLines } from "../lib/jsonl";

const TASKS_DIR = path.join(homedir(), ".aify-studio", "tasks");

const VALID_STATUSES = ["pending", "in_progress", "completed"] as const;

const TASK_STATUS_MARKER = {
  pending: "[ ]",
  in_progress: "[>]",
  completed: "[x]",
} as const;

interface TaskModel {
  id: number;
  subject: string;
  description: string;
  status: (typeof VALID_STATUSES)[number];
  blockedBy: number[];
  blocks: number[];
  chatId?: string;
}

interface UpdateTaskRequest {
  taskId: number;
  status?: (typeof VALID_STATUSES)[number];
  addBlockedBy?: number[];
  addBlocks?: number[];
  chatId?: string;
}

interface CreateTaskToolOptions {
  context: AgentContext;
  needsApproval?: boolean;
}

class TaskRepository {
  private readonly tasksFile: string;

  constructor(tasksFile: string) {
    this.tasksFile = tasksFile;
  }

  async create(subject: string, description = "", chatId: string): Promise<TaskModel> {
    const tasks = await this.readAll();
    const nextId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;

    const task: TaskModel = {
      id: nextId,
      chatId,
      subject,
      description,
      status: "pending",
      blockedBy: [],
      blocks: [],
    };

    await this.writeAll([...tasks, task]);

    return task;
  }

  async get(taskId: number): Promise<TaskModel> {
    const tasks = await this.readAll();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    return task;
  }

  async update({ taskId, status, addBlockedBy, addBlocks }: UpdateTaskRequest): Promise<TaskModel> {
    const tasks = await this.readAll();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) throw new Error(`Task ${taskId} not found`);

    const task = tasks[taskIndex];

    if (status) {
      this.assertStatus(status);
      task.status = status;

      if (status === "completed") {
        for (const t of tasks) {
          if (t.blockedBy.includes(taskId)) {
            t.blockedBy = t.blockedBy.filter((id) => id !== taskId);
          }
        }
      }
    }

    if (addBlockedBy?.length) {
      task.blockedBy = this.mergeUnique(task.blockedBy, addBlockedBy);
    }

    if (addBlocks?.length) {
      task.blocks = this.mergeUnique(task.blocks, addBlocks);
      for (const blockedId of addBlocks) {
        if (blockedId === taskId) continue;
        const blockedTask = tasks.find((t) => t.id === blockedId);
        if (blockedTask && !blockedTask.blockedBy.includes(taskId)) {
          blockedTask.blockedBy = this.mergeUnique(blockedTask.blockedBy, [taskId]);
        }
      }
    }

    await this.writeAll(tasks);

    return task;
  }

  async listAll(): Promise<TaskModel[]> {
    const tasks = await this.readAll();
    return tasks.sort((left, right) => left.id - right.id);
  }

  private async readAll(): Promise<TaskModel[]> {
    try {
      const records = await readJsonLines<TaskModel>(this.tasksFile);
      return records.map((r) => this.normalize(r));
    } catch {
      return [];
    }
  }

  private async writeAll(tasks: TaskModel[]): Promise<void> {
    await writeJsonLines(this.tasksFile, tasks);
  }

  private normalize(task: TaskModel): TaskModel {
    this.assertStatus(task.status);

    return {
      ...task,
      blockedBy: this.mergeUnique(task.blockedBy, []),
      blocks: this.mergeUnique(task.blocks, []),
      description: task.description ?? "",
    };
  }

  private assertStatus(status: string): asserts status is (typeof VALID_STATUSES)[number] {
    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      throw new Error(`Invalid status: ${status}`);
    }
  }

  private mergeUnique(source: number[], target: number[]): number[] {
    const merged = new Set<number>();

    for (const id of source) {
      merged.add(id);
    }

    for (const id of target) {
      merged.add(id);
    }

    return [...merged].sort((left, right) => left - right);
  }
}

const createTaskRepository = (chatId: string) => new TaskRepository(path.join(TASKS_DIR, `${chatId}.jsonl`));

const formatTask = (task: TaskModel): string => JSON.stringify(task, null, 2);

const formatTaskList = (tasks: TaskModel[]): string => {
  if (!tasks.length) {
    return "No tasks.";
  }

  return tasks
    .map((task) => {
      const marker = TASK_STATUS_MARKER[task.status] ?? "[?]";
      const blockedSuffix = task.blockedBy.length > 0 ? ` (blocked by: [${task.blockedBy.join(", ")}])` : "";
      return `${marker} #${task.id}: ${task.subject}${blockedSuffix}`;
    })
    .join("\n");
};

export const createTaskCreateTool = ({ context, needsApproval = true }: CreateTaskToolOptions) =>
  tool({
    description: "Create a persistent task.",
    inputSchema: z.object({
      subject: z.string().min(1),
      description: z.string().optional(),
    }),
    needsApproval,
    execute: async ({ subject, description }) => {
      const tasks = createTaskRepository(context.chatId);
      const created = await tasks.create(subject, description ?? "", context.chatId);

      return {
        title: `task #${created.id}`,
        output: formatTask(created),
      };
    },
    toModelOutput: ({ output }) => ({
      type: "text",
      value: output.output,
    }),
  });

export const createTaskUpdateTool = ({ context, needsApproval = false }: CreateTaskToolOptions) =>
  tool({
    description: "Update task status or dependencies.",
    inputSchema: z.object({
      task_id: z.coerce.number().int().positive(),
      status: z.enum(VALID_STATUSES).optional(),
      addBlockedBy: z.array(z.coerce.number().int().positive()).optional(),
      addBlocks: z.array(z.coerce.number().int().positive()).optional(),
    }),
    needsApproval,
    execute: async ({ task_id, status, addBlockedBy, addBlocks }) => {
      const tasks = createTaskRepository(context.chatId);
      const updated = await tasks.update({
        taskId: task_id,
        status,
        addBlockedBy,
        addBlocks,
      });

      return {
        title: `task #${updated.id}`,
        output: formatTask(updated),
      };
    },
    toModelOutput: ({ output }) => ({
      type: "text",
      value: output.output,
    }),
  });

export const createTaskListTool = ({ context, needsApproval = false }: CreateTaskToolOptions) =>
  tool({
    description: "List all persistent tasks.",
    inputSchema: z.object({}),
    needsApproval,
    execute: async () => {
      const taskManager = createTaskRepository(context.chatId);
      const allTasks = await taskManager.listAll();

      return {
        title: "task list",
        output: formatTaskList(allTasks),
      };
    },
    toModelOutput: ({ output }) => ({
      type: "text",
      value: output.output,
    }),
  });

export const createTaskGetTool = ({ context, needsApproval = false }: CreateTaskToolOptions) =>
  tool({
    description: "Get details for one task.",
    inputSchema: z.object({
      task_id: z.coerce.number().int().positive(),
    }),
    needsApproval,
    execute: async ({ task_id }) => {
      const taskRepository = createTaskRepository(context.chatId);
      const task = await taskRepository.get(task_id);

      return {
        title: `task #${task.id}`,
        output: formatTask(task),
      };
    },
    toModelOutput: ({ output }) => ({
      type: "text",
      value: output.output,
    }),
  });

export type TaskCreateToolType = InferUITool<ReturnType<typeof createTaskCreateTool>>;
export type TaskUpdateToolType = InferUITool<ReturnType<typeof createTaskUpdateTool>>;
export type TaskListToolType = InferUITool<ReturnType<typeof createTaskListTool>>;
export type TaskGetToolType = InferUITool<ReturnType<typeof createTaskGetTool>>;
