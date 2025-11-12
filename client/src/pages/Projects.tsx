import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Globe, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/utils/formatters";

export default function Projects() {
  const [projects] = useState([
    {
      id: "proj1",
      name: "Main Website",
      domain: "example.com",
      createdAt: "2024-09-15T10:00:00Z",
      lastUpdated: "2024-10-25T14:30:00Z",
    },
    {
      id: "proj2",
      name: "Blog Platform",
      domain: "blog.example.com",
      createdAt: "2024-08-20T09:00:00Z",
      lastUpdated: "2024-10-20T11:15:00Z",
    },
    {
      id: "proj3",
      name: "E-commerce Site",
      domain: "shop.example.com",
      createdAt: "2024-07-10T15:00:00Z",
      lastUpdated: "2024-10-18T16:45:00Z",
    },
  ]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">
            Manage your optimization projects
          </p>
        </div>
        <Button data-testid="button-new-project">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground mb-4">
              No projects yet. Create your first project to get started.
            </div>
            <Button data-testid="button-create-first-project">
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover-elevate transition-all cursor-pointer"
              data-testid={`card-project-${project.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-3 h-3" />
                      <span className="truncate">{project.domain}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-menu-${project.id}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem data-testid={`button-view-${project.id}`}>View Details</DropdownMenuItem>
                      <DropdownMenuItem data-testid={`button-edit-${project.id}`}>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" data-testid={`button-delete-${project.id}`}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{formatDate(project.lastUpdated)}</span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
