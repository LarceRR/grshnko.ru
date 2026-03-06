import React from "react";
import {
  Home,
  LayoutGrid,
  Sparkles,
  Smartphone,
  Cpu,
  CalendarClock,
  User,
  Bell,
  MonitorCog,
  Users,
  Bot,
  Palette,
  Settings,
  MoreHorizontal,
  MessageCircle,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

const SIZE = 22;

export const ROUTE_ICONS: Record<string, React.ReactNode> = {
  "/": <Home size={SIZE} />,
  "/tgcosmos/allPosts": <LayoutGrid size={SIZE} />,
  "/chat": <MessageCircle size={SIZE} />,
  "/animations": <Sparkles size={SIZE} />,
  "/animations/constructor": <Sparkles size={SIZE} />,
  "/devices": <Smartphone size={SIZE} />,
  "/ota": <Cpu size={SIZE} />,
  "/sheduled-posts": <CalendarClock size={SIZE} />,
  "/profile": <User size={SIZE} />,
  "/notifications": <Bell size={SIZE} />,
  "/system": <MonitorCog size={SIZE} />,
  "/system/agents": <GraduationCap size={SIZE} />,
  "/system/users": <Users size={SIZE} />,
  "/system/llm-models": <Bot size={SIZE} />,
  "/system/themes": <Palette size={SIZE} />,
  "/system/permissions": <ShieldCheck size={SIZE} />,
  "/settings": <Settings size={SIZE} />,
  "/other": <MoreHorizontal size={SIZE} />,
};

/** Longest matching route key for pathname (e.g. /system/permissions → /system/permissions). */
export function getRouteIcon(pathname: string): React.ReactNode | null {
  const exact = ROUTE_ICONS[pathname];
  if (exact) return exact;
  const matching = Object.keys(ROUTE_ICONS)
    .filter((path) => path !== "/" && pathname.startsWith(path + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return matching ? ROUTE_ICONS[matching] : (ROUTE_ICONS["/"] ?? null);
}

/** Icon for page header (slightly larger). */
export function getPageHeaderIcon(pathname: string): React.ReactNode | null {
  const icon = getRouteIcon(pathname);
  if (!icon || !React.isValidElement(icon)) return icon;
  return React.cloneElement(icon as React.ReactElement<{ size?: number }>, {
    size: 24,
  });
}
