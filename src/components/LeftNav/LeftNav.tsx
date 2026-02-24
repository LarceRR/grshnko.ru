import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  GraduationCap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { APP_ROUTES, AppRoute } from "../../config/routes.config";
import { getUser } from "../../api/user";
import NavUser from "../Navigator/NavUser/NavUser";
import "./LeftNav.scss";

const ROUTE_ICONS: Record<string, React.ReactNode> = {
  "/": <Home size={22} />,
  "/tgcosmos/allPosts": <LayoutGrid size={22} />,
  "/chat": <MessageCircle size={22} />,
  "/animations": <Sparkles size={22} />,
  "/devices": <Smartphone size={22} />,
  "/ota": <Cpu size={22} />,
  "/sheduled-posts": <CalendarClock size={22} />,
  "/profile": <User size={22} />,
  "/notifications": <Bell size={22} />,
  "/system": <MonitorCog size={22} />,
  "/system/agents": <GraduationCap size={22} />,
  "/system/users": <Users size={22} />,
  "/system/llm-models": <Bot size={22} />,
  "/system/themes": <Palette size={22} />,
  "/settings": <Settings size={22} />,
  "/other": <MoreHorizontal size={22} />,
};

function flattenRoutes(routes: AppRoute[]): AppRoute[] {
  return routes.flatMap((r) => [
    r,
    ...(r.children ? flattenRoutes(r.children) : []),
  ]);
}

const flatRoutes = flattenRoutes(APP_ROUTES);

// Most specific match (longest path)
function findActiveRoute(pathname: string): AppRoute | undefined {
  return flatRoutes
    .filter((r) =>
      r.path === "/"
        ? pathname === "/"
        : pathname === r.path || pathname.startsWith(r.path + "/"),
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
}

// Parent route of the active one when inside a group (e.g. /system for /system/agents)
function findParentGroupRoute(
  activeRoute: AppRoute | undefined,
  routes: AppRoute[],
): AppRoute | undefined {
  if (!activeRoute) return undefined;
  return routes.find(
    (r) =>
      r.children?.length &&
      (activeRoute.path === r.path || activeRoute.path.startsWith(r.path + "/")),
  );
}

const ACTIVE_BAR_H = 24;

const LeftNav: React.FC = () => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [indicator, setIndicator] = useState<{
    top: number;
    height: number;
    showCaps: boolean;
  } | null>(null);

  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
    retry: false,
  });

  // Только читаем из кэша: страница Profile при /profile/:id сама кладёт данные с ключом ["user", id]
  const profileMatch = location.pathname.match(/^\/profile\/([^/]+)$/);
  const viewingProfileId = profileMatch ? profileMatch[1] : null;
  const { data: viewedUser } = useQuery({
    queryKey: ["user", viewingProfileId] as const,
    queryFn: ({ queryKey }) => getUser(queryKey[1] ?? undefined),
    enabled: !!viewingProfileId,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    // Тот же ключ, что и на странице Profile — запрос один, данные общие с кэшем
  });

  const activeRoute = findActiveRoute(location.pathname);
  const isAdmin = user?.role?.key === "ADMIN";
  const visibleRoutes = APP_ROUTES.filter((r) => !r.requireAdmin || isAdmin);
  const parentGroupRoute = findParentGroupRoute(activeRoute, visibleRoutes);

  useEffect(() => {
    if (!activeRoute) {
      setIndicator(null);
      return;
    }
    const activeEl = itemRefs.current.get(activeRoute.path);
    if (!activeEl) return;

    const activeCenter = activeEl.offsetTop + activeEl.offsetHeight / 2;

    // When we're on a child of a group: line from parent button to active button
    if (
      parentGroupRoute &&
      parentGroupRoute.path !== activeRoute.path &&
      parentGroupRoute.children?.length
    ) {
      const parentEl = itemRefs.current.get(parentGroupRoute.path);
      if (parentEl) {
        const parentCenter = parentEl.offsetTop + parentEl.offsetHeight / 2;
        const top = Math.min(parentCenter, activeCenter);
        const height = Math.abs(activeCenter - parentCenter);
        setIndicator({ top, height, showCaps: true });
        return;
      }
    }

    setIndicator({
      top: activeCenter - ACTIVE_BAR_H / 2,
      height: ACTIVE_BAR_H,
      showCaps: false,
    });
  }, [location.pathname, expanded, activeRoute, parentGroupRoute]);

  const setRef = (path: string) => (el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(path, el);
    else itemRefs.current.delete(path);
  };

  const getProfileLabel = () => {
    const onOwnProfile = location.pathname === "/profile";
    const displayUser = onOwnProfile ? user : viewedUser;
    if (displayUser?.username) return `Профиль ${displayUser.username}'а`;
    return "Профиль";
  };

  const renderItem = (route: AppRoute, isChild = false) => {
    const icon = ROUTE_ICONS[route.path];
    const label = route.path === "/profile" ? getProfileLabel() : route.label;
    return (
      <div
        key={route.path}
        ref={setRef(route.path)}
        className={`left-nav__item-wrapper${route.enabled ? "" : " left-nav__item-wrapper--disabled"}`}
      >
        <NavLink
          to={route.path}
          end={route.path === "/"}
          className={({ isActive }) =>
            `left-nav__item${isActive ? " left-nav__item--active" : ""}${
              isChild ? " left-nav__item--child" : ""
            }`
          }
        >
          <span className="left-nav__icon">{icon}</span>
          {!expanded && <span className="left-nav__label-collapsed">{label.slice(0, 8)}...</span>}
          {expanded && <span className="left-nav__label">{label}</span>}
        </NavLink>
      </div>
    );
  };

  return (
    <nav className={`left-nav${expanded ? " left-nav--expanded" : ""}`}>
      <div className="left-nav__items" ref={containerRef}>
        {indicator && (
          <div
            className={`left-nav__indicator${indicator.showCaps ? " left-nav__indicator--with-caps" : ""}`}
            style={{ top: indicator.top, height: indicator.height }}
          >
            <div className="left-nav__connector-cap left-nav__connector-cap--top" />
            <div className="left-nav__indicator-bar" />
            <div className="left-nav__connector-cap left-nav__connector-cap--bottom" />
          </div>
        )}

        {visibleRoutes.map((route) => {
          if (route.children?.length) {
            const visibleChildren = route.children.filter(
              (c) => !c.requireAdmin || isAdmin,
            );
            return (
              <div key={route.path} className="left-nav__group">
                <span className="left-nav__group-label">{route.label}</span>
                {renderItem(route)}
                {visibleChildren.map((child) => renderItem(child, true))}
              </div>
            );
          }
          return renderItem(route);
        })}
      </div>

      <div className="left-nav__bottom">
        <NavUser expanded={expanded} />
        <button
          className="left-nav__toggle"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </nav>
  );
};

export default LeftNav;
