import type { ComponentProps } from "react";
import { cn } from "../lib/utils";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";

export function ContentTitleBar({ className, ...props }: ComponentProps<"div">) {
  const { state } = useSidebar();
  return (
    <div className={cn("title-bar", className)} {...props}>
      {state === "collapsed" && <SidebarTrigger className="no-drag" />}
    </div>
  );
}
