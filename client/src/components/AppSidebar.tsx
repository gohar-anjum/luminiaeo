import {
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
  History,
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
import { BrandMark } from "@/components/BrandMark";

const menuGroups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Research",
    items: [
      { title: "Keyword Research", url: "/keyword", icon: Search },
      { title: "FAQ / Facts Generator", url: "/faq", icon: FileQuestion },
    ],
  },
  {
    label: "Page Analysis",
    items: [
      { title: "Meta Tag Optimizer", url: "/meta", icon: Tag },
      { title: "Semantic Score Checker", url: "/semantic", icon: CheckCircle2 },
      { title: "Content Generator", url: "/content-generator", icon: FileText },
      { title: "Analysis History", url: "/page-analysis/history", icon: History },
    ],
  },
  {
    label: "AI Visibility",
    items: [{ title: "AI Indexability & Citations", url: "/visibility", icon: Eye }],
  },
  {
    label: "Optimization",
    items: [
      { title: "Keyword Clustering", url: "/clustering", icon: Network },
      { title: "PBN Detector", url: "/pbn", icon: Shield },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Billing", url: "/billing", icon: CreditCard },
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
          <div className="flex cursor-pointer" data-testid="link-logo" aria-label="Dashboard">
            <BrandMark />
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
                          isActive={location.split("?")[0] === item.url}
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
