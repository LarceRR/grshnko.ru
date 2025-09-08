
import ExplainTab from "../tabs/ExplainTab";
import ParaphraseTab from "../tabs/ParaphraseTab";
import ChannelsTab from "../tabs/ChannelsTab/ChannelsTab";
import { TikTokTab } from "./TikTokTab/TikTokTab";

export type TabKey = "explain" | "paraphrase" | "channels" | "tiktok";

export interface TabConfig {
  key: TabKey;
  label: string;
  Component:  React.FC<any>;
  aiAnswer: boolean;
  enabled: boolean;
}

export const TABS: TabConfig[] = [
  {
    key: "explain",
    label: "Рассказать о теме",
    Component: ExplainTab,
    aiAnswer: true,
    enabled: true,
  },
  {
    key: "paraphrase",
    label: "Перефразировать",
    Component: ParaphraseTab,
    aiAnswer: true,
    enabled: false,
  },
  { 
    key: "channels", 
    label: "Каналы", 
    Component: ChannelsTab, 
    aiAnswer: true,
    enabled: false,
  },
  { 
    key: "tiktok", 
    label: "TikTok", 
    Component: TikTokTab, 
    aiAnswer: true,
    enabled: true,
    },
];