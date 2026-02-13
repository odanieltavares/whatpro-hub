import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InstanceCard } from "./InstanceCard";

// Mock data
const mockInstances = [
  { id: "1", name: "Sales Support", status: "connected", phone: "+55 11 99999-9999" },
  { id: "2", name: "Marketing Bot", status: "disconnected", phone: undefined },
  { id: "3", name: "Customer Service", status: "connected", phone: "+55 11 88888-8888" },
] as const;

export default function InstancesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Instances</h2>
          <p className="text-muted-foreground">
            Manage your WhatsApp connections and pair new devices.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Instance
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockInstances.map((instance) => (
          <InstanceCard
            key={instance.id}
            id={instance.id}
            name={instance.name}
            status={instance.status}
            phone={instance.phone}
          />
        ))}
      </div>
    </div>
  );
}
