import { useChat } from "@ai-sdk/react";
import { eventIteratorToUnproxiedDataStream } from "@orpc/client";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { useRef } from "react";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
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
  onRegenerate: () => void;
};

const AssistantMessage = ({ message, isLastMessage, onRegenerate }: AssistantMessageProps) => {
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
          <MessageAction label="Retry" onClick={onRegenerate}>
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
  const { messages, sendMessage, regenerate, status, error, id } = useChat<ChatMessage>({
    id: chatId,
    messages: initialMessages,
    generateId: generateChatId,
    transport: {
      async sendMessages(options) {
        const lastMessage = options.messages.at(-1);
        return eventIteratorToUnproxiedDataStream(
          await apiClient.chat.create(
            {
              chatId: options.chatId,
              messages: options.messages,
              message: lastMessage,
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
          isLastMessage={messageIndex === messages.length - 1}
          key={message.id}
          message={message}
          onRegenerate={regenerate}
        />
      );
    }

    return null;
  };

  return (
    <div className="overscroll-behavior-contain flex h-dvh w-full flex-1 touch-pan-y flex-col">
      <div className="relative flex-1">
        <div className="absolute inset-0 flex-1 touch-pan-y overflow-hidden"></div>
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
            <PromptInputTools></PromptInputTools>
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}
