import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/renderer/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/renderer/components/ui/sidebar";
import { convertToChatMessages } from "@/shared/lib/chat-converter";
import { Chat } from "../components/chat";
import { ContentTitleBar } from "../components/content-title-bar";
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
        <TitleBar className="pl-20 text-muted-foreground">
          <SidebarTrigger className="no-drag" />
        </TitleBar>
      </AppSidebar>
      <SidebarInset className="island content-island">
        <ContentTitleBar className="pl-20 text-muted-foreground" />
        {initialMessages?.length && <Chat chatId={chatId} initialMessages={initialMessages} />}
        {!initialMessages?.length && <Chat chatId={chatId} initialMessages={initialMessages} />}
      </SidebarInset>
      {/*<div className="secondary-island island" />*/}
    </SidebarProvider>
  );
}
