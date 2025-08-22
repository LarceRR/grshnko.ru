import React from "react";
import "./ExternalLink.scss";
import { ExternalLinkIcon } from "lucide-react";

interface IExternalLinkProps {
  link?: string | "no links provided";
  label?: string | "no label";
}

const ExternalLink: React.FC<IExternalLinkProps> = ({ link, label }) => {
  if (!link) return null;

  return (
    <a
      className="external-link"
      href={link}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label ? label : link}
      <ExternalLinkIcon
        size={18}
        style={{
          color: "var(--link-color)",
        }}
      />
    </a>
  );
};

export default ExternalLink;
