import { useState } from "react";
import { TabKey, TABS } from "../tabs/tabs-array";
import "./GeneratePost.scss";

export default function GeneratePost() {
  const [activeTab, setActiveTab] = useState<TabKey>("explain");

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
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              )
          )}
        </div>

        {activeTabConfig && (
          <div className="tab-content">
            <activeTabConfig.Component />
            <div className="divider"></div>
          </div>
        )}
      </div>
    </div>
  );
}
