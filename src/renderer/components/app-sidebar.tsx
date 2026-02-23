import { Button } from "@base-ui/react/button";
import { useQuery } from "@tanstack/react-query";
import { SquarePen } from "lucide-react";
import { apiClient } from "../lib/api-client";
import { useAppStore } from "../stores";
import { SettingsDialog } from "./settings/settings-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "./ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const setChatId = useAppStore((state) => state.setChatId);

  const listChatsQuery = useQuery({
    queryKey: ["list_chats"],
    queryFn: () => apiClient.chat.list({ limit: 20, direction: "desc" }),
  });

  return (
    <>
      <Sidebar {...props}>
        {props.children}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <SquarePen strokeWidth={1.5} />
                    <span>New thread</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Threads</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {listChatsQuery.data?.chats.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => setChatId(item.id)} render={<Button />}>
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SettingsDialog />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
