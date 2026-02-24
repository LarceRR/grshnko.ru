import React from "react";
import { Link } from "react-router-dom";
import "./AnimationPreview.scss";

interface AnimationPreviewProps {
  data: Record<string, unknown>;
}

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({ data }) => {
  const id = data.animationId as string | undefined;
  const description = (data.description as string) || "";

  if (!id) return null;

  return (
    <div className="animation-preview">
      {description && <p className="animation-preview__desc">{description}</p>}
      <Link to={`/animation/${id}`} className="animation-preview__link">
        Открыть анимацию →
      </Link>
    </div>
  );
};
