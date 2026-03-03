import React from "react";
import { Sparkles } from "lucide-react";
import type { ChatArtifact } from "../../../../utils/chatArtifacts";
import { ArtifactAnimationCard } from "./ArtifactAnimationCard";
import { ArtifactThemeCard } from "./ArtifactThemeCard";
import "./ChatArtifactsSidebar.scss";

interface ChatArtifactsSidebarProps {
  artifacts: ChatArtifact[];
}

export const ChatArtifactsSidebar: React.FC<ChatArtifactsSidebarProps> = ({
  artifacts,
}) => {
  if (artifacts.length === 0) {
    return (
      <div className="chat-artifacts-sidebar">
        <h3 className="chat-artifacts-sidebar__title">
          <Sparkles size={18} />
          Артефакты
        </h3>
        <p className="chat-artifacts-sidebar__empty">
          Артефакты (анимации и темы), созданные агентом в этом чате, появятся
          здесь.
        </p>
      </div>
    );
  }

  return (
    <div className="chat-artifacts-sidebar">
      <h3 className="chat-artifacts-sidebar__title">
        <Sparkles size={18} />
        Артефакты
      </h3>
      <div className="chat-artifacts-sidebar__list">
        {artifacts.map((a, i) =>
          a.type === "animation" ? (
            <ArtifactAnimationCard
              key={`anim-${a.id}-${i}`}
              animationId={a.id}
              description={(a.data.description as string) ?? null}
            />
          ) : (
            <ArtifactThemeCard
              key={`theme-${a.id}-${i}`}
              themeId={a.id}
              data={a.data}
            />
          ),
        )}
      </div>
    </div>
  );
};
