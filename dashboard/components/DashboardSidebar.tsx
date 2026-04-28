import {
  Activity,
  Bell,
  Camera,
  Gauge,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { User } from "../lib/types";
import { cn } from "../lib/utils";

export type DashboardTab =
  | "overview"
  | "incidents"
  | "notifications"
  | "simulator"
  | "users";

type Props = {
  user: User;
  totalIncidents: number;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
};

export function DashboardSidebar({
  user,
  totalIncidents,
  activeTab,
  onTabChange,
}: Props) {
  const navItems = [
    { id: "overview", label: "Overview", icon: Gauge, roles: "all" },
    { id: "incidents", label: "Incidents", icon: Camera, roles: "all" },
    { id: "notifications", label: "Notifications", icon: Bell, roles: "responders" },
    { id: "simulator", label: "Simulator", icon: Activity, roles: "super_admin" },
    { id: "users", label: "Users & invites", icon: Users, roles: "super_admin" },
  ] as const;

  const visibleItems = navItems.filter((item) => {
    if (item.roles === "all") {
      return true;
    }
    if (item.roles === "super_admin") {
      return user.role === "super_admin";
    }
    return ["police", "fire_fighter"].includes(user.role);
  });

  return (
    <aside className="sticky top-0 hidden h-screen overflow-hidden border-r bg-card md:flex md:flex-col">
      <div className="shrink-0 border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield size={17} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Traffic Ops</p>
            <p className="text-xs text-muted-foreground">Incident platform</p>
          </div>
        </div>
      </div>

      <nav className="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-muted-foreground",
                "hover:bg-muted hover:text-foreground",
                activeTab === item.id && "bg-muted text-foreground",
              )}
              key={item.id}
              onClick={() => onTabChange(item.id)}
              type="button"
            >
              <Icon size={16} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 border-t px-5 py-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">Signed in</p>
        <p className="mt-1 truncate text-sm font-medium">{user.full_name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.role.replace("_", " ")}</p>
        <div className="mt-3 rounded-lg border bg-background px-3 py-2">
          <p className="text-xs text-muted-foreground">Active records</p>
          <p className="text-lg font-semibold">{totalIncidents}</p>
        </div>
      </div>
    </aside>
  );
}
