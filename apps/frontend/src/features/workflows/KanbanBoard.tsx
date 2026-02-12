import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Plus } from "lucide-react"

const columns = [
  { id: "todo", title: "To Do", cards: [{ id: "c1", title: "Setup Repo" }, { id: "c2", title: "Design UI" }] },
  { id: "in-progress", title: "In Progress", cards: [{ id: "c3", title: "Frontend Implementation" }] },
  { id: "done", title: "Done", cards: [{ id: "c4", title: "Planning" }] },
]

export default function KanbanBoard() {
  return (
    <div className="flex h-full gap-4 overflow-x-auto p-4 pb-8">
      {columns.map((column) => (
        <div key={column.id} className="w-80 shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{column.title}</h3>
            <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
            {column.cards.map((card) => (
               <Card key={card.id} className="cursor-grab active:cursor-grabbing">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                    Task ID: {card.id}
                  </CardContent>
               </Card>
            ))}
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Card
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
