import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Blocks, Bolt, Brain, Image, Minus, Plus, Type, Video, Volume2, Wrench } from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/renderer/lib/api-client";
import type { AIModelSchema } from "@/shared/ai-provider/ai-provider.schema";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DataTable } from "../ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from "../ui/field";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { Switch } from "../ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const TOKENS_PER_K = 1024;

const MODALITY_REGEX = /\s*,\s*/;

interface NewModelFormValues {
  id: string;
  name: string;
  inputModalities: string;
  outputModalities: string;
  contextLimit: string;
  inputLimit: string;
  outputLimit: string;
  inputCost: string;
  outputCost: string;
  attachment: boolean;
  reasoning: boolean;
  toolCall: boolean;
  structuredOutput: boolean;
  temperature: boolean;
  active: boolean;
}

const createDefaultNewModelValues = (): NewModelFormValues => ({
  id: "",
  name: "",
  inputModalities: "text",
  outputModalities: "text",
  contextLimit: "128000",
  inputLimit: "32000",
  outputLimit: "8000",
  inputCost: "0",
  outputCost: "0",
  attachment: false,
  reasoning: false,
  toolCall: true,
  structuredOutput: false,
  temperature: true,
  active: true,
});

const createEditModelValues = (model: AIModelSchema): NewModelFormValues => ({
  id: model.id,
  name: model.name,
  inputModalities: model.modalities.input.join(","),
  outputModalities: model.modalities.output.join(","),
  contextLimit: (model.limit?.context ?? 0).toString(),
  inputLimit: (model.limit?.input ?? 0).toString(),
  outputLimit: (model.limit?.output ?? 0).toString(),
  inputCost: (model.cost?.input ?? 0).toString(),
  outputCost: (model.cost?.output ?? 0).toString(),
  attachment: model.attachment,
  reasoning: model.reasoning,
  toolCall: model.toolCall,
  structuredOutput: !!model.structuredOutput,
  temperature: !!model.temperature,
  active: !!model.active,
});

const parseCsvValues = (value: string): string[] => {
  return value
    .split(MODALITY_REGEX)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseNumberValue = (value: string, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatLimitToK = (value: number | null | undefined): string => {
  if (value == null) {
    return "-";
  }

  if (value >= TOKENS_PER_K) {
    const kValue = value / TOKENS_PER_K;
    const formatted = Number.isInteger(kValue) ? kValue.toString() : kValue.toFixed(1);
    return `${formatted}K`;
  }

  return value.toString();
};

const modelColumns: ColumnDef<AIModelSchema>[] = [
  {
    accessorKey: "name",
    header: "Model",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm">
        <img alt="zhipu" height={24} src={"/assets/ai-providers/ZhiPuAI.svg"} width={24} />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span>{row.original.name}</span>
            <Badge variant="secondary">{row.original.id}</Badge>
          </div>
          <div className="flex">
            {row.original.limit?.context ? (
              <div className="text-muted-foreground text-xs">
                Context: <span>{formatLimitToK(row.original.limit.context)}</span>
              </div>
            ) : null}
            <span className="mx-1 text-muted-foreground text-xs">·</span>
            {row.original.limit?.input ? (
              <div className="text-muted-foreground text-xs">
                Input: <span>{formatLimitToK(row.original.limit.input)}</span>
              </div>
            ) : null}
            {/* <span className="text-xs text-muted-foreground"> · </span> */}
            {row.original.limit?.output ? (
              <div className="text-muted-foreground text-xs">
                Output: <span>{formatLimitToK(row.original.limit.output)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "input",
    header: "Input",
    cell: ({ row }) => {
      return (
        <div className="flex flex-row gap-2">
          {row.original.modalities.input.includes("text") && (
            <Tooltip>
              <TooltipTrigger render={<Type className="text-foreground" height={16} strokeWidth={1.5} width={16} />} />
              <TooltipContent>
                <p>Text</p>
              </TooltipContent>
            </Tooltip>
          )}
          {row.original.modalities.input.includes("image") && (
            <Tooltip>
              <TooltipTrigger render={<Image className="text-foreground" height={16} strokeWidth={1.5} width={16} />} />
              <TooltipContent>
                <p>Image</p>
              </TooltipContent>
            </Tooltip>
          )}
          {row.original.modalities.input.includes("audio") && (
            <Tooltip>
              <TooltipTrigger
                render={<Volume2 className="text-foreground" height={16} strokeWidth={1.5} width={16} />}
              />
              <TooltipContent>
                <p>Audio</p>
              </TooltipContent>
            </Tooltip>
          )}
          {row.original.modalities.input.includes("video") && (
            <Tooltip>
              <TooltipTrigger render={<Video className="text-foreground" height={16} strokeWidth={1.5} width={16} />} />
              <TooltipContent>
                <p>Video</p>
              </TooltipContent>
            </Tooltip>
          )}
          {row.original.modalities.input.includes("attachment") && (
            <Tooltip>
              <TooltipTrigger render={<Video className="text-foreground" height={16} strokeWidth={1.5} width={16} />} />
              <TooltipContent>
                <p>Paperclip</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "output",
    header: "Output",
    cell: ({ row }) => {
      return (
        <div className="flex flex-row gap-2">
          {row.original.modalities.output.includes("text") && (
            <Tooltip>
              <TooltipTrigger render={<Type className="text-foreground" height={16} strokeWidth={1.5} width={16} />} />
              <TooltipContent>
                <p>Text</p>
              </TooltipContent>
            </Tooltip>
          )}
          {row.original.modalities.output.includes("image") && (
            <Tooltip>
              <TooltipTrigger render={<Image className="text-foreground" height={16} strokeWidth={1.5} width={16} />} />
              <TooltipContent>
                <p>Image</p>
              </TooltipContent>
            </Tooltip>
          )}
          {row.original.modalities.output.includes("audio") && (
            <Tooltip>
              <TooltipTrigger
                render={<Volume2 className="text-foreground" height={16} strokeWidth={1.5} width={16} />}
              />
              <TooltipContent>
                <p>Audio</p>
              </TooltipContent>
            </Tooltip>
          )}
          {row.original.modalities.output.includes("video") && (
            <Tooltip>
              <TooltipTrigger render={<Video className="text-foreground" height={16} strokeWidth={1.5} width={16} />} />
              <TooltipContent>
                <p>Video</p>
              </TooltipContent>
            </Tooltip>
          )}
          {row.original.modalities.output.includes("attachment") && (
            <Tooltip>
              <TooltipTrigger render={<Video className="text-foreground" height={16} strokeWidth={1.5} width={16} />} />
              <TooltipContent>
                <p>Paperclip</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "capabilities",
    header: "Capabilities",
    cell: ({ row }) => {
      return (
        <div className="flex flex-row gap-2">
          {row.original.toolCall && (
            <Tooltip>
              <TooltipTrigger
                render={<Wrench className="text-foreground" height={16} strokeWidth={1.5} width={16} />}
              />
              <TooltipContent>
                <p>Tool call</p>
              </TooltipContent>
            </Tooltip>
          )}
          {row.original.reasoning && (
            <Tooltip>
              <TooltipTrigger render={<Brain className="text-foreground" height={16} strokeWidth={1.5} width={16} />} />
              <TooltipContent>
                <p>Reasoning</p>
              </TooltipContent>
            </Tooltip>
          )}
          {row.original.structuredOutput && (
            <Tooltip>
              <TooltipTrigger
                render={<Blocks className="text-foreground" height={16} strokeWidth={1.5} width={16} />}
              />
              <TooltipContent>
                <p>Structured output</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div>
        <Switch checked={!!row.original.active} />
      </div>
    ),
  },
  {
    accessorKey: "operations",
    header: "Operations",
    cell: ({ row }) => (
      <div className="flex items-center">
        <EditModelDialog model={row.original} />
        <Button size="icon" variant="ghost">
          <Minus />
        </Button>
      </div>
    ),
  },
];

function EditModelDialog({ model }: { model: AIModelSchema }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateModelMutation = useMutation({
    mutationFn: (payload: AIModelSchema) => apiClient.aiProvider.model.update(payload),
  });

  const form = useForm({
    defaultValues: createEditModelValues(model),
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      const inputModalities = parseCsvValues(value.inputModalities);
      const outputModalities = parseCsvValues(value.outputModalities);

      if (!(inputModalities.length && outputModalities.length)) {
        setSubmitError("Input/Output modalities 至少填写一个值");
        return;
      }

      try {
        await updateModelMutation.mutateAsync({
          id: model.id,
          providerId: model.providerId,
          name: value.name.trim(),
          attachment: value.attachment,
          reasoning: value.reasoning,
          toolCall: value.toolCall,
          structuredOutput: value.structuredOutput,
          temperature: value.temperature,
          cost: {
            input: parseNumberValue(value.inputCost),
            output: parseNumberValue(value.outputCost),
            reasoning: null,
            cache_read: null,
            cache_write: null,
            input_audio: null,
            output_audio: null,
          },
          limit: {
            context: parseNumberValue(value.contextLimit),
            input: parseNumberValue(value.inputLimit),
            output: parseNumberValue(value.outputLimit),
          },
          modalities: {
            input: inputModalities,
            output: outputModalities,
          },
          active: value.active,
        });

        setOpen(false);
        await queryClient.invalidateQueries({
          queryKey: ["list_ai_models", model.providerId],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "更新模型失败";
        setSubmitError(message);
      }
    },
  });

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          form.reset(createEditModelValues(model));
          setSubmitError(null);
        }
      }}
      open={open}
    >
      <DialogTrigger
        render={
          <Button size="icon" variant="ghost">
            <Bolt />
          </Button>
        }
      />
      <DialogContent className="h-[80vh] max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogTitle>编辑模型</DialogTitle>
        <DialogDescription>修改当前模型配置</DialogDescription>
        <form
          className="mt-2 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit().catch((error) => {
              const message = error instanceof Error ? error.message : "更新模型失败";
              setSubmitError(message);
            });
          }}
        >
          <FieldSet>
            <FieldGroup>
              <Field orientation="responsive">
                <FieldContent>
                  <FieldLabel htmlFor={`edit-model-id-${model.id}`}>模型 ID</FieldLabel>
                </FieldContent>
                <Input disabled id={`edit-model-id-${model.id}`} value={model.id} />
              </Field>

              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => (value.trim() ? undefined : "模型名称不能为空"),
                }}
              >
                {(field) => {
                  const error = field.state.meta.errors[0];

                  return (
                    <Field data-invalid={!!error} orientation="responsive">
                      <FieldContent>
                        <FieldLabel htmlFor={`edit-model-name-${model.id}`}>模型名称</FieldLabel>
                        <FieldError>{typeof error === "string" ? error : null}</FieldError>
                      </FieldContent>
                      <Input
                        id={`edit-model-name-${model.id}`}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        value={field.state.value}
                      />
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="inputModalities">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-input-modalities-${model.id}`}>输入模态</FieldLabel>
                    </FieldContent>
                    <Input
                      id={`edit-model-input-modalities-${model.id}`}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="outputModalities">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-output-modalities-${model.id}`}>输出模态</FieldLabel>
                    </FieldContent>
                    <Input
                      id={`edit-model-output-modalities-${model.id}`}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="contextLimit">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-context-limit-${model.id}`}>Context Limit</FieldLabel>
                    </FieldContent>
                    <Input
                      id={`edit-model-context-limit-${model.id}`}
                      inputMode="numeric"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="inputLimit">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-input-limit-${model.id}`}>Input Limit</FieldLabel>
                    </FieldContent>
                    <Input
                      id={`edit-model-input-limit-${model.id}`}
                      inputMode="numeric"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="outputLimit">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-output-limit-${model.id}`}>Output Limit</FieldLabel>
                    </FieldContent>
                    <Input
                      id={`edit-model-output-limit-${model.id}`}
                      inputMode="numeric"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="inputCost">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-input-cost-${model.id}`}>Input Cost</FieldLabel>
                    </FieldContent>
                    <Input
                      id={`edit-model-input-cost-${model.id}`}
                      inputMode="decimal"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="outputCost">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-output-cost-${model.id}`}>Output Cost</FieldLabel>
                    </FieldContent>
                    <Input
                      id={`edit-model-output-cost-${model.id}`}
                      inputMode="decimal"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="toolCall">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-tool-call-${model.id}`}>Tool Call</FieldLabel>
                    </FieldContent>
                    <Switch
                      checked={field.state.value}
                      id={`edit-model-tool-call-${model.id}`}
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="reasoning">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-reasoning-${model.id}`}>Reasoning</FieldLabel>
                    </FieldContent>
                    <Switch
                      checked={field.state.value}
                      id={`edit-model-reasoning-${model.id}`}
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="structuredOutput">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-structured-output-${model.id}`}>Structured Output</FieldLabel>
                    </FieldContent>
                    <Switch
                      checked={field.state.value}
                      id={`edit-model-structured-output-${model.id}`}
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="attachment">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-attachment-${model.id}`}>Attachment</FieldLabel>
                    </FieldContent>
                    <Switch
                      checked={field.state.value}
                      id={`edit-model-attachment-${model.id}`}
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="temperature">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-temperature-${model.id}`}>Temperature</FieldLabel>
                    </FieldContent>
                    <Switch
                      checked={field.state.value}
                      id={`edit-model-temperature-${model.id}`}
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="active">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor={`edit-model-active-${model.id}`}>Active</FieldLabel>
                    </FieldContent>
                    <Switch
                      checked={field.state.value}
                      id={`edit-model-active-${model.id}`}
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </FieldSet>

          {submitError ? <FieldError>{submitError}</FieldError> : null}

          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              取消
            </Button>
            <form.Subscribe selector={(state) => [state.isSubmitting] as const}>
              {([isSubmitting]) => (
                <Button disabled={isSubmitting || updateModelMutation.isPending} type="submit">
                  {isSubmitting || updateModelMutation.isPending ? "保存中..." : "保存修改"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddModelDialog({ providerId, onCreated }: { providerId: string; onCreated: () => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createModelMutation = useMutation({
    mutationFn: (payload: AIModelSchema) => apiClient.aiProvider.model.create(payload),
  });

  const form = useForm({
    defaultValues: createDefaultNewModelValues(),
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      const inputModalities = parseCsvValues(value.inputModalities);
      const outputModalities = parseCsvValues(value.outputModalities);

      if (!(inputModalities.length && outputModalities.length)) {
        setSubmitError("Input/Output modalities 至少填写一个值");
        return;
      }

      try {
        await createModelMutation.mutateAsync({
          id: value.id.trim(),
          providerId,
          name: value.name.trim(),
          attachment: value.attachment,
          reasoning: value.reasoning,
          toolCall: value.toolCall,
          structuredOutput: value.structuredOutput,
          temperature: value.temperature,
          cost: {
            input: parseNumberValue(value.inputCost),
            output: parseNumberValue(value.outputCost),
            reasoning: null,
            cache_read: null,
            cache_write: null,
            input_audio: null,
            output_audio: null,
          },
          limit: {
            context: parseNumberValue(value.contextLimit),
            input: parseNumberValue(value.inputLimit),
            output: parseNumberValue(value.outputLimit),
          },
          modalities: {
            input: inputModalities,
            output: outputModalities,
          },
          active: value.active,
        });

        form.reset(createDefaultNewModelValues());
        setOpen(false);
        await onCreated();
      } catch (error) {
        const message = error instanceof Error ? error.message : "创建模型失败";
        setSubmitError(message);
      }
    },
  });

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setSubmitError(null);
          form.reset(createDefaultNewModelValues());
        }
      }}
      open={open}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Plus />
            添加模型
          </Button>
        }
      />
      <DialogContent className="h-[80vh] max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogTitle>新增模型</DialogTitle>
        <DialogDescription>使用 TanStack Form 创建模型并保存到当前 Provider</DialogDescription>
        <form
          className="mt-2 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit().catch((error) => {
              const message = error instanceof Error ? error.message : "创建模型失败";
              setSubmitError(message);
            });
          }}
        >
          <FieldSet>
            <FieldGroup>
              <form.Field
                name="id"
                validators={{
                  onChange: ({ value }) => (value.trim() ? undefined : "模型 ID 不能为空"),
                }}
              >
                {(field) => {
                  const error = field.state.meta.errors[0];

                  return (
                    <Field data-invalid={!!error} orientation="responsive">
                      <FieldContent>
                        <FieldLabel htmlFor="new-model-id">模型 ID</FieldLabel>
                        <FieldDescription>例如: `glm-4.5`</FieldDescription>
                        <FieldError>{typeof error === "string" ? error : null}</FieldError>
                      </FieldContent>
                      <Input
                        id="new-model-id"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="glm-4.5"
                        value={field.state.value}
                      />
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => (value.trim() ? undefined : "模型名称不能为空"),
                }}
              >
                {(field) => {
                  const error = field.state.meta.errors[0];

                  return (
                    <Field data-invalid={!!error} orientation="responsive">
                      <FieldContent>
                        <FieldLabel htmlFor="new-model-name">模型名称</FieldLabel>
                        <FieldDescription>用于展示在模型列表</FieldDescription>
                        <FieldError>{typeof error === "string" ? error : null}</FieldError>
                      </FieldContent>
                      <Input
                        id="new-model-name"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="GLM-4.5"
                        value={field.state.value}
                      />
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field
                name="inputModalities"
                validators={{
                  onChange: ({ value }) => (parseCsvValues(value).length ? undefined : "至少填写一个输入模态"),
                }}
              >
                {(field) => {
                  const error = field.state.meta.errors[0];

                  return (
                    <Field data-invalid={!!error} orientation="responsive">
                      <FieldContent>
                        <FieldLabel htmlFor="new-model-input-modalities">输入模态</FieldLabel>
                        <FieldDescription>逗号分隔，例如 `text,image`</FieldDescription>
                        <FieldError>{typeof error === "string" ? error : null}</FieldError>
                      </FieldContent>
                      <Input
                        id="new-model-input-modalities"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="text,image"
                        value={field.state.value}
                      />
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field
                name="outputModalities"
                validators={{
                  onChange: ({ value }) => (parseCsvValues(value).length ? undefined : "至少填写一个输出模态"),
                }}
              >
                {(field) => {
                  const error = field.state.meta.errors[0];

                  return (
                    <Field data-invalid={!!error} orientation="responsive">
                      <FieldContent>
                        <FieldLabel htmlFor="new-model-output-modalities">输出模态</FieldLabel>
                        <FieldDescription>逗号分隔，例如 `text,image`</FieldDescription>
                        <FieldError>{typeof error === "string" ? error : null}</FieldError>
                      </FieldContent>
                      <Input
                        id="new-model-output-modalities"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="text"
                        value={field.state.value}
                      />
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="contextLimit">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor="new-model-context-limit">Context Limit</FieldLabel>
                      <FieldDescription>填写 token 数</FieldDescription>
                    </FieldContent>
                    <Input
                      id="new-model-context-limit"
                      inputMode="numeric"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="inputLimit">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor="new-model-input-limit">Input Limit</FieldLabel>
                    </FieldContent>
                    <Input
                      id="new-model-input-limit"
                      inputMode="numeric"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="outputLimit">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor="new-model-output-limit">Output Limit</FieldLabel>
                    </FieldContent>
                    <Input
                      id="new-model-output-limit"
                      inputMode="numeric"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="inputCost">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor="new-model-input-cost">Input Cost</FieldLabel>
                      <FieldDescription>每 1M token 成本（数值）</FieldDescription>
                    </FieldContent>
                    <Input
                      id="new-model-input-cost"
                      inputMode="decimal"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="outputCost">
                {(field) => (
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel htmlFor="new-model-output-cost">Output Cost</FieldLabel>
                      <FieldDescription>每 1M token 成本（数值）</FieldDescription>
                    </FieldContent>
                    <Input
                      id="new-model-output-cost"
                      inputMode="decimal"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="toolCall">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor="new-model-tool-call">Tool Call</FieldLabel>
                    </FieldContent>
                    <Switch checked={field.state.value} id="new-model-tool-call" onCheckedChange={field.handleChange} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="reasoning">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor="new-model-reasoning">Reasoning</FieldLabel>
                    </FieldContent>
                    <Switch checked={field.state.value} id="new-model-reasoning" onCheckedChange={field.handleChange} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="structuredOutput">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor="new-model-structured-output">Structured Output</FieldLabel>
                    </FieldContent>
                    <Switch
                      checked={field.state.value}
                      id="new-model-structured-output"
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="attachment">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor="new-model-attachment">Attachment</FieldLabel>
                    </FieldContent>
                    <Switch
                      checked={field.state.value}
                      id="new-model-attachment"
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="temperature">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor="new-model-temperature">Temperature</FieldLabel>
                    </FieldContent>
                    <Switch
                      checked={field.state.value}
                      id="new-model-temperature"
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="active">
                {(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor="new-model-active">Active</FieldLabel>
                    </FieldContent>
                    <Switch checked={field.state.value} id="new-model-active" onCheckedChange={field.handleChange} />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </FieldSet>

          {submitError ? <FieldError>{submitError}</FieldError> : null}

          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              取消
            </Button>
            <form.Subscribe selector={(state) => [state.isSubmitting] as const}>
              {([isSubmitting]) => (
                <Button disabled={isSubmitting || createModelMutation.isPending} type="submit">
                  {isSubmitting || createModelMutation.isPending ? "保存中..." : "保存模型"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ModelSettings() {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const listAIProvidersQuery = useQuery({
    queryKey: ["list_ai_providers"],
    queryFn: () => apiClient.aiProvider.list(),
  });

  const listModelsQuery = useQuery({
    queryKey: ["list_ai_models", selectedProviderId],
    queryFn: () => {
      if (!selectedProviderId) {
        throw new Error("providerId is required");
      }

      return apiClient.aiProvider.model.list({ providerId: selectedProviderId });
    },
    enabled: !!selectedProviderId,
  });

  return (
    <div className="flex flex-1">
      <div className="w-60">
        <Input placeholder="Search providers..." />
        <SidebarMenu className="gap-1 p-2">
          {listAIProvidersQuery.data?.map((e) => (
            <SidebarMenuItem key={e.id}>
              <SidebarMenuButton isActive={selectedProviderId === e.id} onClick={() => setSelectedProviderId(e.id)}>
                <img alt={e.name} height={24} src={`/assets/ai-providers/${e.id}.svg`} width={24} />
                <span>{e.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="p-8" />
      </div>
      <Separator orientation="vertical" />
      <div className="flex-1 p-6">
        {selectedProviderId ? (
          <div>
            <h1 className="mb-4 font-semibold text-lg">
              {listAIProvidersQuery.data?.find((p) => p.id === selectedProviderId)?.name}
            </h1>
            <Separator className="mb-6" orientation="horizontal" />
            <FieldSet className="gap-6">
              <FieldGroup>
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldLabel className="text-sm" htmlFor="name">
                      API URL
                    </FieldLabel>
                    <FieldDescription>Provide your full name for identification</FieldDescription>
                  </FieldContent>
                  <Input className="min-w-60" id="name" placeholder="Evil Rabbit" required />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldLabel className="text-sm" htmlFor="name">
                      API Key
                    </FieldLabel>
                    <FieldDescription>Provide your full name for identification</FieldDescription>
                  </FieldContent>
                  <Input className="min-w-60" id="name" placeholder="Evil Rabbit" required />
                </Field>
              </FieldGroup>
            </FieldSet>
            <div className="mt-12 mb-4 flex items-center justify-between gap-4">
              <h1 className="font-semibold text-lg">模型列表</h1>
              <AddModelDialog onCreated={() => listModelsQuery.refetch()} providerId={selectedProviderId} />
            </div>
            <DataTable
              columns={modelColumns}
              data={(listModelsQuery.data as AIModelSchema[] | undefined) ?? []}
              emptyMessage="No models available"
              isLoading={listModelsQuery.isLoading}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Select a provider to view its models
          </div>
        )}
      </div>
    </div>
  );
}
