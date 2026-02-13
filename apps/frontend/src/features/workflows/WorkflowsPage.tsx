import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FlowEditor from "./FlowEditor"
import KanbanBoard from "./KanbanBoard"

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflows</h2>
          <p className="text-muted-foreground">
            Automate your conversations and manage tasks.
          </p>
        </div>
      </div>

      <Tabs defaultValue="flow" className="w-full">
        <TabsList>
          <TabsTrigger value="flow">Flow Editor</TabsTrigger>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
        </TabsList>
        <TabsContent value="flow">
          <FlowEditor />
        </TabsContent>
        <TabsContent value="kanban">
          <KanbanBoard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
