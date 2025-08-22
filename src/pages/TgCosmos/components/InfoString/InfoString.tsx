import React from "react";
import "./InfoString.scss";
import { ExternalLinkIcon } from "lucide-react";

interface IInfoStringProps {
  label?: string | "no label";
  information?: string | "no information";
}

const InfoString: React.FC<IInfoStringProps> = ({ label, information }) => {
  const isLink = information?.startsWith("http");
  const isLong = information && information.length > 50;

  return (
    <div className="info-string-wrapper">
      <span className="info-string__label">{label}:</span>
      <span className="info-string__dots" aria-hidden="true" />
      <span className="info-string__value">
        {isLink ? (
          <a
            href={information}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            {isLong ? "Ссылка" : information}
            <ExternalLinkIcon
              size={18}
              style={{ color: "var(--link-color)", marginLeft: 4 }}
            />
          </a>
        ) : (
          information
        )}
      </span>
    </div>
  );
};

export default InfoString;
