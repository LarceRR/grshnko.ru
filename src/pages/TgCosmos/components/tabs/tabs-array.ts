
import ExplainTab from "../tabs/ExplainTab";
import ParaphraseTab from "../tabs/ParaphraseTab";
import ChannelsTab from "../tabs/ChannelsTab/ChannelsTab";
import { TikTokTab } from "./TikTokTab/TikTokTab";

export type TabKey = "explain" | "paraphrase" | "channels" | "tiktok";

export interface TabConfig {
  key: TabKey;
  label: string;
  Component: React.FC;
  aiAnswer: boolean;
  
}

export const TABS: TabConfig[] = [
  {
    key: "explain",
    label: "Рассказать о теме",
    Component: ExplainTab,
    aiAnswer: true,
  },
  {
    key: "paraphrase",
    label: "Перефразировать",
    Component: ParaphraseTab,
    aiAnswer: true,
  },
  { 
    key: "channels", 
    label: "Каналы", 
    Component: ChannelsTab, 
    aiAnswer: true 
},
  { 
    key: "tiktok", 
    label: "TikTok", 
    Component: TikTokTab, 
    aiAnswer: true 
    },
];