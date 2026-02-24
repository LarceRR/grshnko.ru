import React from "react";
import Markdown from "react-markdown";
import type { ChatAgent } from "../../../types/chat.types";
import "./ChatWelcome.scss";

interface ChatWelcomeProps {
  agent: Pick<ChatAgent, "name" | "avatar"> & {
    description?: string | null;
    welcomeMessage?: string | null;
  };
}

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({ agent }) => {
  const message =
    agent.welcomeMessage ||
    `Чат с агентом **${agent.name}**. ${agent.description || ""}`;

  return (
    <div className="chat-welcome">
      {agent.avatar && (
        <img src={agent.avatar} alt="" className="chat-welcome__avatar" />
      )}
      <h2 className="chat-welcome__name">{agent.name}</h2>
      {agent.description && (
        <p className="chat-welcome__description">{agent.description}</p>
      )}
      <div className="chat-welcome__message">
        <Markdown>{message}</Markdown>
      </div>
    </div>
  );
};
