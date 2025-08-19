import React from "react";
import "./InfoString.scss";
import ExternalLink from "../ExternalLink/ExternalLink";

interface IInfoStringProps {
  label?: string | "no label";
  information?: string | "no information";
}

const InfoString: React.FC<IInfoStringProps> = ({ label, information }) => {
  const linkInformation = information?.startsWith("http");

  return (
    <div className="info-string-wrapper">
      <span className="info-string__label">{label}:</span>
      <span className="info-string__dots" aria-hidden="true" />
      <span className="info-string__value">
        {linkInformation ? <ExternalLink link={information} /> : information}
      </span>
    </div>
  );
};

export default InfoString;
