import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Edit3,
  BookOpen,
  RefreshCw,
  BarChart3,
  Moon,
  Heart,
  Hash,
  Users,
  FileText,
  Lightbulb,
} from "lucide-react";

const mainItems = [
  { title: "Write", url: "/", icon: Edit3, color: "hsl(30, 10%, 30%)" },
  { title: "Journal", url: "/journal", icon: BookOpen, color: "hsl(30, 10%, 30%)" },
  { title: "Reflect", url: "/reflect", icon: RefreshCw, color: "hsl(30, 10%, 30%)" },
  { title: "Insights", url: "/insights", icon: BarChart3, color: "hsl(30, 10%, 30%)" },
];

const secondaryItems = [
  { title: "Dreams", url: "/dreams", icon: Moon, color: "hsl(35, 85%, 45%)" },
  { title: "Highlights", url: "/highlights", icon: Heart, color: "hsl(0, 75%, 50%)" },
  { title: "Tags", url: "/tags", icon: Hash, color: "hsl(230, 60%, 55%)" },
  { title: "People", url: "/people", icon: Users, color: "hsl(140, 50%, 40%)" },
  { title: "Notes", url: "/notes", icon: FileText, color: "hsl(175, 50%, 40%)" },
  { title: "Wisdom", url: "/wisdom", icon: Lightbulb, color: "hsl(270, 55%, 50%)" },
];

export function AppSidebar() {
  const [location] = useLocation();

  const renderItems = (items: typeof mainItems) =>
    items.map((item) => {
      const isActive = item.url === "/" ? location === "/" : location.startsWith(item.url);
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
            <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
              <item.icon style={{ color: item.color }} className="flex-shrink-0" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <span className="font-serif text-lg font-bold" data-testid="text-app-title">OpenJournal</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(secondaryItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
