import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAnimationDetail } from "../../../api/animations";
import { getUser } from "../../../api/user";
import { LAST_EDITED_IDS_KEY, MAX_LAST_EDITED } from "./constants";
import { Plus, Sparkles } from "lucide-react";
import "./ConstructorLanding.scss";

export default function ConstructorLanding() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
    retry: false,
  });

  const hasPermission = user?.permissions?.includes("ANIMATION_CREATE") ?? false;

  const lastEditedIds = (() => {
    try {
      const raw = localStorage.getItem(LAST_EDITED_IDS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_LAST_EDITED) : [];
    } catch {
      return [];
    }
  })();

  const handleCreateNew = () => {
    navigate("/animations/constructor/new");
  };

  if (!hasPermission) {
    return (
      <div className="constructor-landing">
        <div className="constructor-landing__header">
          <h1>Конструктор анимаций</h1>
        </div>
        <div className="constructor-landing__no-permission">
          <p>У вас нет прав на создание анимаций. Обратитесь к администратору.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="constructor-landing">
      <div className="constructor-landing__header">
        <h1>Конструктор анимаций</h1>
        <p className="constructor-landing__subtitle">
          Создавайте и редактируйте LED-анимации визуально
        </p>
      </div>

      <section className="constructor-landing__recent">
        <h2>Последние редактируемые</h2>
        {lastEditedIds.length === 0 ? (
          <div className="constructor-landing__empty">
            <p>Пока нет недавно редактируемых анимаций</p>
          </div>
        ) : (
          <div className="constructor-landing__cards">
            <RecentAnimationCards ids={lastEditedIds} onSelect={navigate} />
          </div>
        )}
      </section>

      <section className="constructor-landing__actions">
        <button
          type="button"
          className="constructor-landing__create-btn"
          onClick={handleCreateNew}
        >
          <Plus size={24} />
          Создать новую анимацию
        </button>
      </section>
    </div>
  );
}

function RecentAnimationCards({
  ids,
  onSelect,
}: {
  ids: string[];
  onSelect: (path: string) => void;
}) {
  return (
    <>
      {ids.map((id) => (
        <RecentCard key={id} id={id} onSelect={onSelect} />
      ))}
    </>
  );
}

function RecentCard({
  id,
  onSelect,
}: {
  id: string;
  onSelect: (path: string) => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["animation-detail", id],
    queryFn: () => getAnimationDetail(id),
    enabled: id !== "new",
    retry: false,
  });

  if (id === "new") return null;

  const handleClick = () => onSelect(`/animations/constructor/${id}`);

  if (isLoading) {
    return (
      <div className="constructor-card constructor-card--loading">
        <span>Загрузка…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className="constructor-card constructor-card--error"
        onClick={() => {
          const raw = localStorage.getItem(LAST_EDITED_IDS_KEY);
          if (raw) {
            try {
              const arr = JSON.parse(raw) as string[];
              const updated = arr.filter((x) => x !== id);
              localStorage.setItem(LAST_EDITED_IDS_KEY, JSON.stringify(updated));
              window.location.reload();
            } catch {}
          }
        }}
      >
        <span>Анимация не найдена (удалить из списка)</span>
      </div>
    );
  }

  return (
    <div className="constructor-card" onClick={handleClick}>
      <div className="constructor-card__icon">
        <Sparkles size={28} />
      </div>
      <div className="constructor-card__info">
        <span className="constructor-card__id">{data.id}</span>
        {data.labels && data.labels.length > 0 && (
          <div className="constructor-card__labels">
            {data.labels.slice(0, 3).map((l) => (
              <span key={l} className="constructor-card__label">
                {l}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
