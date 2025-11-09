import React from "react";
import { useUA } from "use-ua-parser-js";
import "./UserAgent.scss";

interface IUserAgentProps {
  useragent: string;
}

function getBrowserIcon(browserName: string) {
  const name = browserName.toLowerCase();

  if (name.includes("chrome")) return "/icons/google.svg";
  if (name.includes("firefox")) return "/icons/firefox.svg";
  if (name.includes("safari")) return "/icons/safari.svg";
  if (name.includes("edge")) return "/icons/edge.svg";
  if (name.includes("yandex")) return "/icons/yandex.svg";
  if (name.includes("internet explorer") || name.includes("ie")) return "📘";

  return "🌐";
}

function getOSIcon(osName: string) {
  const name = osName.toLowerCase();

  if (name.includes("windows")) return "/icons/windows.svg";
  if (name.includes("mac")) return "/icons/apple.svg";
  if (name.includes("linux")) return "/icons/linux.svg";
  if (name.includes("android")) return "/icons/android.svg";
  if (name.includes("ios")) return "/icons/apple.svg";

  return "💻";
}

function getDeviceIcon(deviceType: string) {
  const type = deviceType.toLowerCase();

  if (type.includes("mobile")) return "/icons/mobile.svg";
  if (type.includes("tablet")) return "/icons/tablet.svg";
  if (type.includes("desktop")) return "/icons/desktop.svg";
  if (type.includes("smarttv")) return "📺";
  if (type.includes("console")) return "🎮";

  return "/icons/laptop.svg";
}

const UserAgent: React.FC<IUserAgentProps> = ({ useragent }) => {
  const UADetails = useUA(useragent);

  return (
    <div className="UAWrapper">
      {UADetails?.browser.name && (
        <img src={getBrowserIcon(UADetails.browser.name)}></img>
      )}
      {UADetails?.os.name && <img src={getOSIcon(UADetails.os.name)}></img>}
      {UADetails?.device.name && (
        <img src={getDeviceIcon(UADetails.device.name)}></img>
      )}
    </div>
  );
};

export default UserAgent;
