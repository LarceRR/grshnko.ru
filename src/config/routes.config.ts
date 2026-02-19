export interface AppRoute {
  path: string;
  label: string;
  requireAdmin?: boolean;
  children?: AppRoute[];
  enabled?: boolean;
}

/**
 * Все навигируемые страницы приложения.
 * Отражает маршруты из App.tsx (без динамических /:id и /login).
 * Используется в дропдауне стартовой страницы и других местах.
 */
export const APP_ROUTES: AppRoute[] = [
  { path: "/", label: "Главная", enabled: true },
  { path: "/tgcosmos/allPosts", label: "Все посты", enabled: false },
  { path: "/animations", label: "Анимации", enabled: true },
  { path: "/devices", label: "Устройства", enabled: true },
  { path: "/ota", label: "OTA / Прошивки", enabled: true },
  { path: "/sheduled-posts", label: "Запланированные посты", enabled: true },
  { path: "/profile", label: "Профиль", enabled: true },
  { path: "/notifications", label: "Уведомления", enabled: true },
  {
    path: "/system",
    label: "Система",
    enabled: true,
    requireAdmin: true,
    children: [
      { path: "/system/users", label: "Пользователи", requireAdmin: true, enabled: true },
      { path: "/system/llm-models", label: "LLM модели", requireAdmin: true, enabled: true },
      { path: "/system/themes", label: "Темы сайта", requireAdmin: true, enabled: true },
    ],
  },
  { path: "/settings", label: "Настройки", enabled: true },
  { path: "/other", label: "Другое", enabled: true },
];

// ---------------------------------------------------------------------------

interface FlatOption {
  value: string;
  label: string;
}

interface GroupOption {
  label: string;
  options: FlatOption[];
}

export type SelectOption = FlatOption | GroupOption;

/**
 * Конвертирует APP_ROUTES в формат Ant Design Select.
 * Роуты с children становятся группами (родитель + дети внутри).
 */
export function buildSelectOptions(routes: AppRoute[]): SelectOption[] {
  return routes.map((route) => {
    if (route.children?.length) {
      return {
        label: route.label,
        options: [
          { value: route.path, label: route.label },
          ...route.children.map((child) => ({
            value: child.path,
            label: child.label,
          })),
        ],
      };
    }
    return { value: route.path, label: route.label };
  });
}
