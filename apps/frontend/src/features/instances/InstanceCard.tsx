import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, QrCode, RefreshCw, Trash2 } from "lucide-react"

interface InstanceCardProps {
  id: string
  name: string
  status: "connected" | "disconnected" | "connecting"
  phone?: string
}

export function InstanceCard({ name, status, phone }: InstanceCardProps) {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>{name}</CardTitle>
            <Badge variant={status === "connected" ? "default" : "destructive"}>
                {status}
            </Badge>
        </div>
        <CardDescription>{phone || "No number paired"}</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "disconnected" ? (
             <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md bg-muted/50">
                <QrCode className="h-10 w-10 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">Scan QR Code</span>
             </div>
        ) : (
            <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-md dark:bg-green-900/20">
                <Github className="h-10 w-10 text-green-600 mb-2" />
                <span className="text-xs text-green-600 font-medium">Synced</span>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Restart
        </Button>
        <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
