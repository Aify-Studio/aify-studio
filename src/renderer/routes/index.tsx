import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/renderer/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/renderer/components/ui/sidebar";
import { convertToChatMessages } from "@/shared/lib/chat-converter";
import { Chat } from "../components/chat";
import { TitleBar } from "../components/title-bar";
import { apiClient } from "../lib/api-client";
import { useAppStore } from "../stores";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const chatId = useAppStore((state) => state.chatId);
  const getChatMessagesQuery = useQuery({
    queryKey: ["getChatMessages", chatId],
    queryFn: () => apiClient.chat.getChatMessages({ chatId: chatId ?? "" }),
    enabled: Boolean(chatId),
  });

  const initialMessages = convertToChatMessages(getChatMessagesQuery.data);

  return (
    <SidebarProvider>
      <AppSidebar className="primary-island island">
        <TitleBar />
      </AppSidebar>
      <SidebarInset className="island content-island">
        <TitleBar />
        {initialMessages?.length && <Chat chatId={chatId} initialMessages={initialMessages} />}
        {!initialMessages?.length && <Chat chatId={chatId} initialMessages={initialMessages} />}
      </SidebarInset>
      {/*<div className="secondary-island island" />*/}
    </SidebarProvider>
  );
}
