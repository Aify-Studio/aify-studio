import { useChat } from "@ai-sdk/react";
import { eventIteratorToUnproxiedDataStream } from "@orpc/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/renderer/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/renderer/components/ui/sidebar";
import { apiClient } from "../lib/api-client";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { messages, sendMessage, status } = useChat({
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
      reconnectToStream(options) {
        throw new Error("Unsupported");
      },
    },
  });
  const [input, setInput] = useState("");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="content">
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "user" ? "User: " : "AI: "}
                {message.parts.map((part, index) =>
                  part.type === "text" ? <span key={index}>{part.text}</span> : null
                )}
              </div>
            ))}

            <form
              className="flex flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage({ text: input });
                  setInput("");
                }
              }}
            >
              <input
                disabled={status !== "ready"}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Say something..."
                value={input}
              />
              <button disabled={status !== "ready"} type="submit">
                Submit
              </button>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
