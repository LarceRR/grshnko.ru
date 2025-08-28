import React, { ReactNode } from "react";
import "./InfoString.scss";
import { ExternalLinkIcon } from "lucide-react";

interface IInfoStringProps {
  label?: string;
  information?: string | ReactNode;
}

const InfoString: React.FC<IInfoStringProps> = ({
  label = "no label",
  information = "no information",
}) => {
  const isString = typeof information === "string";
  const isLink = isString && information.startsWith("http");
  const isLong = isString && information.length > 50;

  return (
    <div className="info-string-wrapper">
      <span className="info-string__label">{label}:</span>
      <span className="info-string__dots" aria-hidden="true" />
      <span className="info-string__value">
        {isLink ? (
          <a
            href={information as string}
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
