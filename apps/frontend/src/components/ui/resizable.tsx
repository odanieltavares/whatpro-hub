import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: GroupProps) {
  return <Group className={cn("flex h-full w-full", className)} {...props} />
}

function ResizablePanel({ className, ...props }: PanelProps) {
  return <Panel className={cn("relative", className)} {...props} />
}

function ResizableHandle({
  className,
  withHandle,
  ...props
}: SeparatorProps & { withHandle?: boolean }) {
  return (
    <Separator
      className={cn(
        "relative flex w-2 items-center justify-center bg-border/30 transition-colors hover:bg-border/60",
        className
      )}
      {...props}
    >
      {withHandle ? (
        <div className="h-6 w-1.5 rounded-full bg-border" />
      ) : null}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
