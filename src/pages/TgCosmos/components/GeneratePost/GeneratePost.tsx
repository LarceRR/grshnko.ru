import React, { useState } from "react";
import ExplainTab from "../tabs/ExplainTab";
import ParaphraseTab from "../tabs/ParaphraseTab";
import AiAnswer from "./AiAnswer/AiAnswer";
import "./GeneratePost.scss";
import ChannelsTab from "../tabs/ChannelsTab/ChannelsTab";

type TabKey = "explain" | "paraphrase" | "channels";

interface TabConfig {
  key: TabKey;
  label: string;
  Component: React.FC; // <-- ключевое уточнение
}

const TABS: TabConfig[] = [
  { key: "explain", label: "Рассказать о теме", Component: ExplainTab },
  { key: "paraphrase", label: "Перефразировать", Component: ParaphraseTab },
  { key: "channels", label: "Каналы", Component: ChannelsTab }, // Заглушка для "Каналы"
];

export default function GeneratePost() {
  const [activeTab, setActiveTab] = useState<TabKey>("explain");

  const activeTabConfig = TABS.find((tab) => tab.key === activeTab);

  return (
    <div className="generate-post-wrapper">
      <div>
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTabConfig && <activeTabConfig.Component />}
      </div>

      <div className="divider"></div>

      <AiAnswer />
    </div>
  );
}
