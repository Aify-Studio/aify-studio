import { type UseChatHelpers, useChat } from "@ai-sdk/react";
import { eventIteratorToUnproxiedDataStream } from "@orpc/client";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { useRef } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/renderer/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/renderer/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/renderer/components/ai-elements/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/renderer/components/ai-elements/reasoning";
import type { ChatMessage } from "@/shared/lib/chat.schema";
import { generateChatId } from "@/shared/lib/id-utils";
import { apiClient } from "../lib/api-client";
import { BashTool } from "./tools/bash";
import { ReadTool } from "./tools/read";
import { TaskTool } from "./tools/task";
import { WriteTool } from "./tools/write";

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
        <MessageActions className="pointer-events-none ml-auto opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          <MessageAction
            label="Copy"
            onClick={() => {
              void navigator.clipboard.writeText(part.text);
            }}
          >
            <CopyIcon className="size-3" />
          </MessageAction>
        </MessageActions>
      </Message>
    );
  });
};

type AssistantMessageProps = {
  message: ChatMessage;
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  addToolOutput: UseChatHelpers<ChatMessage>["addToolOutput"];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
};

const AssistantMessage = ({ addToolOutput, addToolApprovalResponse, message, regenerate }: AssistantMessageProps) => {
  if (message.role !== "assistant") {
    return null;
  }

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

        if (part.type === "tool-bash") {
          return (
            <BashTool addToolApprovalResponse={addToolApprovalResponse} addToolOutput={addToolOutput} part={part} />
          );
        }

        if (part.type === "tool-read") {
          return (
            <ReadTool addToolApprovalResponse={addToolApprovalResponse} addToolOutput={addToolOutput} part={part} />
          );
        }

        if (part.type === "tool-write") {
          return (
            <WriteTool addToolApprovalResponse={addToolApprovalResponse} addToolOutput={addToolOutput} part={part} />
          );
        }

        if (part.type === "tool-task") {
          return (
            <TaskTool addToolApprovalResponse={addToolApprovalResponse} addToolOutput={addToolOutput} part={part} />
          );
        }

        if (part.type === "text") {
          return (
            <Message from="assistant" key={`${message.id}-assistant-text-${partIndex}`}>
              <MessageContent>
                <MessageResponse>{part.text}</MessageResponse>
              </MessageContent>
              <MessageActions className="pointer-events-none mr-auto opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                <MessageAction label="Retry" onClick={() => regenerate()}>
                  <RefreshCcwIcon className="size-3" />
                </MessageAction>
                <MessageAction
                  label="Copy"
                  onClick={() => {
                    void navigator.clipboard.writeText(part.text);
                  }}
                >
                  <CopyIcon className="size-3" />
                </MessageAction>
              </MessageActions>
            </Message>
          );
        }

        return null;
      })}
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

  const renderMessage = (message: ChatMessage) => {
    if (message.role === "user") {
      return <UserMessage key={message.id} message={message} />;
    }

    if (message.role === "assistant") {
      return (
        <AssistantMessage
          addToolApprovalResponse={addToolApprovalResponse}
          addToolOutput={addToolOutput}
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
