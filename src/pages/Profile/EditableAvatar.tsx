import React, { useRef, useState } from "react";
import { API_URL } from "../../config";
import { Camera, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EditableAvatar: React.FC<{
  avatarUrl?: string | null;
  onSave: (file: File | null) => Promise<void>;
}> = ({ avatarUrl, onSave }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      await onSave(file);
    }
  };

  const checkAvatar = () => {
    if (preview) return preview;
    if (avatarUrl) return `${API_URL}cdn/avatar/${avatarUrl}`;
    return null;
  };

  return (
    <div
      className="editable-avatar"
      style={{ position: "relative", width: 100, height: 100 }}
    >
      <AnimatePresence mode="wait">
        {checkAvatar() ? (
          <motion.img
            key={checkAvatar()} // ключ нужен, чтобы AnimatePresence понимал смену
            src={checkAvatar()!}
            alt="avatar"
            style={{ width: 100, height: 100, borderRadius: "50%" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
          />
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              backgroundColor: "var(--background-color, #eee)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={40} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="update-avatar-button"
        >
          <Camera size={20} />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default EditableAvatar;
