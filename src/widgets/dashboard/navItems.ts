import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  LineChart,
} from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  disabled?: boolean;
};

export const dashboardNavItems: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Forms", href: "/dashboard/forms", icon: FileText },
  { label: "Analytics", href: "/dashboard/analytics", icon: LineChart },
];
