import {
  BarChart3,
  Search,
  FileQuestion,
  CheckCircle2,
  FileText,
  Eye,
  Network,
  Shield,
  Tag,
  FolderKanban,
  CreditCard,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const menuGroups = [
  // {
  //   label: "Overview",
  //   items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  // },
  {
    label: "Research",
    items: [
      { title: "Keyword Research", url: "/keyword", icon: Search },
      { title: "FAQ / Facts Generator", url: "/faq", icon: FileQuestion },
    ],
  },
  // {
  //   label: "Content Intelligence",
  //   items: [
  //     { title: "Semantic Score Checker", url: "/semantic", icon: CheckCircle2 },
  //     { title: "Semantic Content Generator", url: "/content-generator", icon: FileText },
  //   ],
  // },
  {
    label: "AI Visibility",
    items: [{ title: "AI Indexability & Citations", url: "/visibility", icon: Eye }],
  },
  {
    label: "Optimization",
    items: [
      // { title: "Keyword Clustering", url: "/clustering", icon: Network },
      { title: "PBN Detector", url: "/pbn", icon: Shield },
      // { title: "Meta Tag Optimizer", url: "/meta", icon: Tag },
    ],
  },
  {
    label: "Project / Settings",
    items: [
      // { title: "Projects", url: "/projects", icon: FolderKanban },
      // { title: "Billing", url: "/billing", icon: CreditCard },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(
    menuGroups.map((g) => g.label)
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <Link href="/dashboard">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-sm">LUMINI AEO</div>
              <div className="text-xs text-muted-foreground">Answer Engine Optimization</div>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {menuGroups.map((group) => (
          <Collapsible
            key={group.label}
            open={openGroups.includes(group.label)}
            onOpenChange={() => toggleGroup(group.label)}
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel 
                  className="cursor-pointer flex items-center justify-between hover-elevate rounded-md px-2 py-1.5"
                  data-testid={`button-toggle-${group.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      openGroups.includes(group.label) ? "" : "-rotate-90"
                    }`}
                  />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={location === item.url}
                          data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <Link href={item.url}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
