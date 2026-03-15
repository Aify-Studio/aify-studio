import { type UseChatHelpers, useChat } from "@ai-sdk/react";
import { eventIteratorToUnproxiedDataStream } from "@orpc/client";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useRef } from "react";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import type { ChatMessage } from "@/shared/lib/chat.schema";
import { generateChatId } from "@/shared/lib/id-utils";
import { Conversation, ConversationContent, ConversationScrollButton } from "../components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "../components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../components/ai-elements/prompt-input";
import { apiClient } from "../lib/api-client";

type ChatProps = {
  chatId: string | undefined;
  initialMessages?: ChatMessage[];
};

type UserMessageProps = {
  message: ChatMessage;
};

const UserMessage = ({ message }: UserMessageProps) => {
  if (message.role !== "user") {
    return null;
  }

  return message.parts.map((part, partIndex) => {
    if (part.type !== "text") {
      return null;
    }

    return (
      <Message from="user" key={`${message.id}-user-text-${partIndex}`}>
        <MessageContent>
          <MessageResponse>{part.text}</MessageResponse>
        </MessageContent>
      </Message>
    );
  });
};

type AssistantMessageProps = {
  message: ChatMessage;
  isLastMessage: boolean;
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  addToolOutput: UseChatHelpers<ChatMessage>["addToolOutput"];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
};

const AssistantMessage = ({
  addToolOutput,
  addToolApprovalResponse,
  message,
  isLastMessage,
  regenerate,
}: AssistantMessageProps) => {
  if (message.role !== "assistant") {
    return null;
  }

  const assistantText = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");

  return (
    <div className="flex flex-col gap-2">
      {message.parts.map((part, partIndex) => {
        if (part.type === "reasoning") {
          return (
            <Reasoning className="w-full" isStreaming={false} key={`${message.id}-reasoning-${partIndex}`}>
              <ReasoningTrigger />
              <ReasoningContent>{part.text}</ReasoningContent>
            </Reasoning>
          );
        }

        if (part.type === "tool-askForConfirmation") {
          return (
            <Tool
              defaultOpen={
                part.state === "input-available" ||
                part.state === "input-streaming" ||
                part.state === "approval-requested"
              }
              key={part.toolCallId}
            >
              <ToolHeader state={part.state} title={part.title} type={part.type} />
              <ToolContent>
                <ToolInput input={part.input || ""} />
                {part.state === "approval-requested" && (
                  <Confirmation
                    approval={{ approved: part.approval.approved, id: part.toolCallId, reason: part.approval.reason }}
                    state="approval-requested"
                  >
                    <ConfirmationTitle>
                      <ConfirmationRequest>
                        This tool will execute a query on the production database.
                      </ConfirmationRequest>
                      <ConfirmationAccepted>
                        <span>Accepted</span>
                      </ConfirmationAccepted>
                      <ConfirmationRejected>
                        <span>Rejected</span>
                      </ConfirmationRejected>
                    </ConfirmationTitle>
                    <ConfirmationActions>
                      <ConfirmationAction
                        onClick={() =>
                          part.approval.id
                            ? addToolApprovalResponse({
                                id: part.approval.id,
                                approved: false,
                              })
                            : addToolOutput({
                                tool: "askForConfirmation",
                                toolCallId: part.toolCallId,
                                output: "No, denied.",
                              })
                        }
                        variant="outline"
                      >
                        Reject
                      </ConfirmationAction>
                      <ConfirmationAction
                        onClick={() =>
                          part.approval.id
                            ? addToolApprovalResponse({
                                id: part.approval.id,
                                approved: true,
                              })
                            : addToolOutput({
                                tool: "askForConfirmation",
                                toolCallId: part.toolCallId,
                                output: "Yes, confirmed.",
                              })
                        }
                        variant="default"
                      >
                        Accept
                      </ConfirmationAction>
                    </ConfirmationActions>
                  </Confirmation>
                )}
                {part.state === "approval-responded" && (
                  <Confirmation
                    approval={{
                      approved: part.approval.approved,
                      id: part.toolCallId || nanoid(),
                      reason: part.approval.reason,
                    }}
                    state="approval-requested"
                  >
                    <ConfirmationTitle>
                      <ConfirmationRequest>
                        This tool will execute a query on the production database.
                      </ConfirmationRequest>
                      <ConfirmationAccepted>
                        <span>Accepted</span>
                      </ConfirmationAccepted>
                      <ConfirmationRejected>
                        <span>Rejected</span>
                      </ConfirmationRejected>
                    </ConfirmationTitle>
                  </Confirmation>
                )}
                <ToolOutput errorText={part.errorText} output={part.output || ""} />
              </ToolContent>
            </Tool>
          );
        }

        if (part.type === "tool-getLocation") {
          return (
            <Tool
              defaultOpen={
                part.state === "input-available" ||
                part.state === "input-streaming" ||
                part.state === "approval-requested"
              }
              key={part.toolCallId}
            >
              <ToolHeader state={part.state} title={part.title} type={part.type} />
              <ToolContent>
                <ToolInput input={part.input || ""} />
                {part.state === "approval-requested" && (
                  <Confirmation
                    approval={{ approved: part.approval.approved, id: part.toolCallId, reason: part.approval.reason }}
                    state="approval-requested"
                  >
                    <ConfirmationTitle>
                      <ConfirmationRequest>
                        This tool will execute a query on the production database.
                      </ConfirmationRequest>
                      <ConfirmationAccepted>
                        <span>Accepted</span>
                      </ConfirmationAccepted>
                      <ConfirmationRejected>
                        <span>Rejected</span>
                      </ConfirmationRejected>
                    </ConfirmationTitle>
                    <ConfirmationActions>
                      <ConfirmationAction
                        onClick={() =>
                          part.approval.id
                            ? addToolApprovalResponse({
                                id: part.approval.id,
                                approved: false,
                              })
                            : addToolOutput({
                                tool: "getLocation",
                                toolCallId: part.toolCallId,
                                output: "No, denied.",
                              })
                        }
                        variant="outline"
                      >
                        Reject
                      </ConfirmationAction>
                      <ConfirmationAction
                        onClick={() =>
                          part.approval.id
                            ? addToolApprovalResponse({
                                id: part.approval.id,
                                approved: true,
                              })
                            : addToolOutput({
                                tool: "getLocation",
                                toolCallId: part.toolCallId,
                                output: "Yes, confirmed.",
                              })
                        }
                        variant="default"
                      >
                        Accept
                      </ConfirmationAction>
                    </ConfirmationActions>
                  </Confirmation>
                )}
                {part.state === "approval-responded" && (
                  <Confirmation
                    approval={{
                      approved: part.approval.approved,
                      id: part.toolCallId || nanoid(),
                      reason: part.approval.reason,
                    }}
                    state="approval-requested"
                  >
                    <ConfirmationTitle>
                      <ConfirmationRequest>
                        This tool will execute a query on the production database.
                      </ConfirmationRequest>
                      <ConfirmationAccepted>
                        <span>Accepted</span>
                      </ConfirmationAccepted>
                      <ConfirmationRejected>
                        <span>Rejected</span>
                      </ConfirmationRejected>
                    </ConfirmationTitle>
                  </Confirmation>
                )}
                <ToolOutput errorText={part.errorText} output={part.output || ""} />
              </ToolContent>
            </Tool>
          );
        }

        if (part.type === "tool-getWeatherInformation") {
          return (
            <Tool
              defaultOpen={
                part.state === "input-available" ||
                part.state === "input-streaming" ||
                part.state === "approval-requested"
              }
              key={part.toolCallId}
            >
              <ToolHeader state={part.state} title={part.title} type={part.type} />
              <ToolContent>
                <ToolInput input={part.input || ""} />
                {part.state === "approval-requested" && (
                  <Confirmation
                    approval={{ approved: part.approval.approved, id: part.toolCallId, reason: part.approval.reason }}
                    state="approval-requested"
                  >
                    <ConfirmationTitle>
                      <ConfirmationRequest>
                        This tool will execute a query on the production database.
                      </ConfirmationRequest>
                      <ConfirmationAccepted>
                        <span>Accepted</span>
                      </ConfirmationAccepted>
                      <ConfirmationRejected>
                        <span>Rejected</span>
                      </ConfirmationRejected>
                    </ConfirmationTitle>
                    <ConfirmationActions>
                      <ConfirmationAction
                        onClick={() =>
                          part.approval.id
                            ? addToolApprovalResponse({
                                id: part.approval.id,
                                approved: false,
                              })
                            : addToolOutput({
                                tool: "getWeatherInformation",
                                toolCallId: part.toolCallId,
                                output: "No, denied.",
                              })
                        }
                        variant="outline"
                      >
                        Reject
                      </ConfirmationAction>
                      <ConfirmationAction
                        onClick={() => {
                          part.approval.id
                            ? addToolApprovalResponse({
                                id: part.approval.id,
                                approved: true,
                              })
                            : addToolOutput({
                                tool: "getWeatherInformation",
                                toolCallId: part.toolCallId,
                                output: "Yes, confirmed.",
                              });
                        }}
                        variant="default"
                      >
                        Accept
                      </ConfirmationAction>
                    </ConfirmationActions>
                  </Confirmation>
                )}
                {part.state === "approval-responded" && (
                  <Confirmation
                    approval={{
                      approved: part.approval.approved,
                      id: part.toolCallId || nanoid(),
                      reason: part.approval.reason,
                    }}
                    state="approval-requested"
                  >
                    <ConfirmationTitle>
                      <ConfirmationRequest>
                        This tool will execute a query on the production database.
                      </ConfirmationRequest>
                      <ConfirmationAccepted>
                        <span>Accepted</span>
                      </ConfirmationAccepted>
                      <ConfirmationRejected>
                        <span>Rejected</span>
                      </ConfirmationRejected>
                    </ConfirmationTitle>
                  </Confirmation>
                )}
                <ToolOutput errorText={part.errorText} output={part.output || ""} />
              </ToolContent>
            </Tool>
          );
        }

        if (part.type === "text") {
          return (
            <Message from="assistant" key={`${message.id}-assistant-text-${partIndex}`}>
              <MessageContent>
                <MessageResponse>{part.text}</MessageResponse>
              </MessageContent>
            </Message>
          );
        }

        return null;
      })}

      {isLastMessage && (
        <MessageActions>
          <MessageAction label="Retry" onClick={() => regenerate()}>
            <RefreshCcwIcon className="size-3" />
          </MessageAction>
          <MessageAction
            label="Copy"
            onClick={() => {
              void navigator.clipboard.writeText(assistantText);
            }}
          >
            <CopyIcon className="size-3" />
          </MessageAction>
        </MessageActions>
      )}
    </div>
  );
};

export function Chat({ chatId, initialMessages }: ChatProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, regenerate, status, error, addToolOutput, addToolApprovalResponse } =
    useChat<ChatMessage>({
      id: chatId,
      messages: initialMessages,
      generateId: generateChatId,
      transport: {
        async sendMessages(options) {
          return eventIteratorToUnproxiedDataStream(
            await apiClient.chat.create(
              {
                chatId: options.chatId,
                messages: options.messages,
              },
              { signal: options.abortSignal }
            )
          );
        },
        async reconnectToStream(options) {
          return eventIteratorToUnproxiedDataStream(
            await apiClient.chat.getChatStream({ chatId: options.chatId })
          ) as any;
        },
      },
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
      // run client-side tools that are automatically executed:
      async onToolCall({ toolCall }) {
        // Check if it's a dynamic tool first for proper type narrowing
        if (toolCall.dynamic) {
          return;
        }

        if (toolCall.toolName === "getLocation") {
          const cities = ["New York", "Los Angeles", "Chicago", "San Francisco"];

          // No await - avoids potential deadlocks
          addToolOutput({
            tool: "getLocation",
            toolCallId: toolCall.toolCallId,
            output: cities[Math.floor(Math.random() * cities.length)],
          });
        }
      },
    });

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ role: "user" as const, parts: [{ type: "text", text: message.text }] });
    }
  };

  const renderMessage = (message: ChatMessage, messageIndex: number) => {
    if (message.role === "user") {
      return <UserMessage key={message.id} message={message} />;
    }

    if (message.role === "assistant") {
      return (
        <AssistantMessage
          addToolApprovalResponse={addToolApprovalResponse}
          addToolOutput={addToolOutput}
          isLastMessage={messageIndex === messages.length - 1}
          key={message.id}
          message={message}
          regenerate={regenerate}
        />
      );
    }

    return null;
  };

  return (
    <div className="overscroll-behavior-contain flex h-dvh w-full flex-1 touch-pan-y flex-col">
      <div className="relative flex-1">
        <div className="absolute inset-0 flex-1 touch-pan-y overflow-hidden" />
        <Conversation>
          <ConversationContent>
            {messages.map(renderMessage)}
            {error && (
              <Message from="assistant">
                <MessageContent>
                  <MessageResponse className="text-destructive">{error.message}</MessageResponse>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
      <PromptInputProvider>
        <PromptInput
          className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4"
          globalDrop
          multiple
          onSubmit={handleSubmit}
        >
          <PromptInputBody>
            <PromptInputTextarea ref={textareaRef} />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}
