import React from "react";
import { Folder, FileText, Image, FileCode, File } from "lucide-react";
import "./ChatFilesSidebar.scss";

interface MockFile {
  id: string;
  name: string;
  type: "document" | "image" | "code" | "other";
  size: string;
  date: string;
}

const MOCK_FILES: MockFile[] = [
  { id: "1", name: "project-specs.pdf", type: "document", size: "2.4 MB", date: "2026-02-25" },
  { id: "2", name: "architecture-diagram.png", type: "image", size: "1.1 MB", date: "2026-02-24" },
  { id: "3", name: "config.json", type: "code", size: "4.2 KB", date: "2026-02-23" },
  { id: "4", name: "meeting-notes.docx", type: "document", size: "856 KB", date: "2026-02-22" },
  { id: "5", name: "logo.svg", type: "image", size: "12 KB", date: "2026-02-20" },
  { id: "6", name: "utils.ts", type: "code", size: "8.5 KB", date: "2026-02-18" },
];

const getFileIcon = (type: MockFile["type"]) => {
  switch (type) {
    case "document":
      return <FileText size={18} />;
    case "image":
      return <Image size={18} />;
    case "code":
      return <FileCode size={18} />;
    default:
      return <File size={18} />;
  }
};

export const ChatFilesSidebar: React.FC = () => {
  return (
    <div className="chat-files-sidebar">
      <h3 className="chat-files-sidebar__title">
        <Folder size={18} />
        Файлы
      </h3>
      <div className="chat-files-sidebar__content">
        <p className="chat-files-sidebar__empty">
          Файлы, загруженные в этом чате, появятся здесь.
        </p>
        <div className="chat-files-sidebar__mock-list">
          {MOCK_FILES.map((file) => (
            <div key={file.id} className="chat-files-sidebar__file-item">
              <div className="chat-files-sidebar__file-icon">
                {getFileIcon(file.type)}
              </div>
              <div className="chat-files-sidebar__file-info">
                <span className="chat-files-sidebar__file-name">{file.name}</span>
                <span className="chat-files-sidebar__file-meta">
                  {file.size} • {file.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
