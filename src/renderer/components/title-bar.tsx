import type { ComponentProps } from "react";
import { cn } from "../lib/utils";

export function TitleBar({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("title-bar", className)} {...props} />;
}
