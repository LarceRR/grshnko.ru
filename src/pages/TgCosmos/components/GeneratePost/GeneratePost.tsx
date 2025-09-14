import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TabKey, TABS } from "../tabs/tabs-array";
import "./GeneratePost.scss";

export default function GeneratePost() {
  const [activeTab, setActiveTab] = useState<TabKey>("explain");
  const navigate = useNavigate();

  const activeTabConfig = TABS.find((tab) => tab.key === activeTab);

  return (
    <div className="generate-post-wrapper">
      <div>
        <div className="tabs">
          {TABS.map(
            (tab) =>
              tab.enabled && (
                <button
                  key={tab.key}
                  className={`tab-button ${
                    activeTab === tab.key ? "active" : ""
                  }`}
                  onClick={() => {
                    if (tab.navigateTo) {
                      navigate(tab.navigateTo); // если есть navigateTo — переходим
                    } else {
                      setActiveTab(tab.key); // иначе просто меняем активный таб
                    }
                  }}
                >
                  {tab.label}
                </button>
              )
          )}
        </div>

        {activeTabConfig && !activeTabConfig.navigateTo && (
          <div className="tab-content">
            {activeTabConfig.Component && <activeTabConfig.Component />}
            <div className="divider"></div>
          </div>
        )}
      </div>
    </div>
  );
}
