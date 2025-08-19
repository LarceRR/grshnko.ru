import { version } from "../../../../../package.json";
import ExternalLink from "../ExternalLink/ExternalLink";
import "./AppVersion.scss";

export const AppVersion = () => {
  return (
    <div className="app-version">
      <ExternalLink
        link="https://github.com/LarceRR/grshnko.ru"
        label="Telegram Autopost"
      />
      <span className="app-version__divider">|</span>
      <span className="app-version__number">v{version}</span>
    </div>
  );
};
