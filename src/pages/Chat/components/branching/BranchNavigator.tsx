import React from "react";
import { Button } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./BranchNavigator.scss";

interface BranchNavigatorProps {
  messageId: string;
  currentIndex: number;
  totalBranches: number;
  onNavigate: (messageId: string, branchIndex: number) => void;
}

export const BranchNavigator: React.FC<BranchNavigatorProps> = ({
  messageId,
  currentIndex,
  totalBranches,
  onNavigate,
}) => {
  if (totalBranches <= 1) return null;

  return (
    <div className="branch-navigator">
      <Button
        type="text"
        size="small"
        icon={<ChevronLeft size={14} />}
        disabled={currentIndex === 0}
        onClick={() => onNavigate(messageId, currentIndex - 1)}
        className="branch-navigator__btn"
      />
      <span className="branch-navigator__counter">
        {currentIndex + 1} / {totalBranches}
      </span>
      <Button
        type="text"
        size="small"
        icon={<ChevronRight size={14} />}
        disabled={currentIndex >= totalBranches - 1}
        onClick={() => onNavigate(messageId, currentIndex + 1)}
        className="branch-navigator__btn"
      />
    </div>
  );
};
