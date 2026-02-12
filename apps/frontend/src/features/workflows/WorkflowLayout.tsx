import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export function WorkflowLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
}) {
  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-[calc(100vh-4rem)] rounded-lg border">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
        <div className="h-full bg-muted/20 p-4">
            {sidebar}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <div className="h-full p-6">
            {children}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
