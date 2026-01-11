import { useChat } from "@ai-sdk/react";
import { eventIteratorToUnproxiedDataStream } from "@orpc/client";
import { createFileRoute } from "@tanstack/react-router";
import { generateId } from "ai";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { Fragment, useRef } from "react";
import { AppSidebar } from "@/renderer/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/renderer/components/ui/sidebar";
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
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../components/ai-elements/prompt-input";
import { apiClient } from "../lib/api-client";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, regenerate, status, error } = useChat({
    transport: {
      async sendMessages(options) {
        const lastMessage = options.messages.at(-1);
        return eventIteratorToUnproxiedDataStream(
          await apiClient.chat.create(
            {
              chatId: options.chatId || generateId(),
              messages: options.messages,
              message: lastMessage,
            },
            { signal: options.abortSignal }
          )
        );
      },
      reconnectToStream(options) {
        throw new Error("Unsupported");
      },
    },
  });

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ role: "user" as const, parts: [{ type: "text", text: message.text }] });
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="content">
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          <div className="flex-1 rounded-xl md:min-h-min">
            <Conversation>
              <ConversationContent>
                {messages.map((message, messageIndex) => (
                  <Fragment key={message.id}>
                    {message.parts.map((part) => {
                      switch (part.type) {
                        case "text": {
                          const isLastMessage = messageIndex === messages.length - 1;
                          return (
                            <div key={message.key}>
                              <Message from={message.role}>
                                <MessageContent>
                                  <MessageResponse>{part.text}</MessageResponse>
                                </MessageContent>
                              </Message>
                              {message.role === "assistant" && isLastMessage && (
                                <MessageActions>
                                  <MessageAction label="Retry" onClick={() => regenerate()}>
                                    <RefreshCcwIcon className="size-3" />
                                  </MessageAction>
                                  <MessageAction label="Copy" onClick={() => navigator.clipboard.writeText(part.text)}>
                                    <CopyIcon className="size-3" />
                                  </MessageAction>
                                </MessageActions>
                              )}
                            </div>
                          );
                        }
                        default:
                          return null;
                      }
                    })}
                  </Fragment>
                ))}
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
            <PromptInput globalDrop multiple onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea ref={textareaRef} />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                  </PromptInputActionMenu>
                  {/*<ModelSelector
                    onOpenChange={setModelSelectorOpen}
                    open={modelSelectorOpen}
                  >
                    <ModelSelectorTrigger asChild>
                      <PromptInputButton>
                        {selectedModelData?.chefSlug && (
                          <ModelSelectorLogo
                            provider={selectedModelData.chefSlug}
                          />
                        )}
                        {selectedModelData?.name && (
                          <ModelSelectorName>
                            {selectedModelData.name}
                          </ModelSelectorName>
                        )}
                      </PromptInputButton>
                    </ModelSelectorTrigger>
                    <ModelSelectorContent>
                      <ModelSelectorInput placeholder="Search models..." />
                      <ModelSelectorList>
                        <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                        {["OpenAI", "Anthropic", "Google"].map((chef) => (
                          <ModelSelectorGroup heading={chef} key={chef}>
                            {models
                              .filter((m) => m.chef === chef)
                              .map((m) => (
                                <ModelSelectorItem
                                  key={m.id}
                                  onSelect={() => {
                                    setModel(m.id);
                                    setModelSelectorOpen(false);
                                  }}
                                  value={m.id}
                                >
                                  <ModelSelectorLogo provider={m.chefSlug} />
                                  <ModelSelectorName>{m.name}</ModelSelectorName>
                                  <ModelSelectorLogoGroup>
                                    {m.providers.map((provider) => (
                                      <ModelSelectorLogo
                                        key={provider}
                                        provider={provider}
                                      />
                                    ))}
                                  </ModelSelectorLogoGroup>
                                  {model === m.id ? (
                                    <CheckIcon className="ml-auto size-4" />
                                  ) : (
                                    <div className="ml-auto size-4" />
                                  )}
                                </ModelSelectorItem>
                              ))}
                          </ModelSelectorGroup>
                        ))}
                      </ModelSelectorList>
                    </ModelSelectorContent>
                  </ModelSelector>*/}
                </PromptInputTools>
                <PromptInputSubmit status={status} />
              </PromptInputFooter>
            </PromptInput>
          </PromptInputProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
