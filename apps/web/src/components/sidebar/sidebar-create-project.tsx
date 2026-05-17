import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orpc, queryClient } from "@/utils/orpc";
import { useState } from "react";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

function SidebarCreateProject() {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const createMutation = useMutation(
    orpc.project.create.mutationOptions({
      onSuccess: (data) => {
        toast.success("Project created");
        setNewProjectName("");
        setShowCreateForm(false);
        queryClient.invalidateQueries({
          queryKey: orpc.project.getAll.queryKey(),
        });
        navigate({
          to: "/app/projects/$projectId",
          params: { projectId: data.id },
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  return (
    <SidebarMenuItem className="py-3">
      {showCreateForm ? (
        <form
          className="flex flex-col gap-2 p-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newProjectName.trim()) {
              createMutation.mutate({
                name: newProjectName,
                visibility: "private",
              });
            }
          }}
        >
          <Input
            autoFocus
            className="h-7 text-xs"
            disabled={createMutation.isPending}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name..."
            value={newProjectName}
          />
          <div className="flex gap-1">
            <Button
              className="flex-1"
              disabled={
                createMutation.isPending || !newProjectName.trim()
              }
              size="xs"
              type="submit"
            >
              {createMutation.isPending ? "..." : "Create"}
            </Button>
            <Button
              onClick={() => {
                setShowCreateForm(false);
                setNewProjectName("");
              }}
              size="xs"
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <SidebarMenuButton onClick={() => setShowCreateForm(true)}>
          <Plus />
          <span>Create Project</span>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  )
}

export default SidebarCreateProject;
