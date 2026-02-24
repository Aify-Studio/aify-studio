import { ArrowLeft, Bolt, Palette, UserCog } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { TitleBar } from "../title-bar";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "../ui/sidebar";
import { AppearanceSettings } from "./appearance-settings";
import { GeneralSettings } from "./general-settings";

const data = {
  nav: [
    { key: "general", titleKey: "settings.general.title" as const, icon: UserCog },
    { key: "appearance", titleKey: "settings.appearance.title" as const, icon: Palette },
  ],
};

export function SettingsDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("general");

  return (
    <Dialog modal={true} onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <SidebarMenuButton>
            <Bolt strokeWidth={1.5} />
            <span>{t("settings.title")}</span>
          </SidebarMenuButton>
        }
      />
      <DialogContent
        className="h-screen max-h-none w-screen overflow-hidden rounded-none p-0 sm:max-w-none"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{t("settings.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("settings.description")}</DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar className="primary-island island hidden md:flex" collapsible="none">
            <TitleBar />
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuButton className="text-muted-foreground" onClick={() => setOpen(false)}>
                      <ArrowLeft strokeWidth={1.5} />
                      <span>{t("settings.backToApp")}</span>
                    </SidebarMenuButton>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          isActive={item.key === activeTab}
                          onClick={() => setActiveTab(item.key)}
                          render={
                            <a href="#">
                              <item.icon strokeWidth={1.5} />
                              <span>{t(item.titleKey)}</span>
                            </a>
                          }
                        />
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="island min-h-full content-island">
            <TitleBar />
            {activeTab === "appearance" && <AppearanceSettings />}
            {activeTab === "general" && <GeneralSettings />}
          </SidebarInset>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
