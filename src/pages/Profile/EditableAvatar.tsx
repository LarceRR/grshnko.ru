import React, { useRef, useState } from "react";

const EditableAvatar: React.FC<{
  avatarUrl?: string | null;
  onSave: (file: File | null) => Promise<void>;
}> = ({ avatarUrl, onSave }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setPreview(URL.createObjectURL(file));
      await onSave(file);
    }
  };

  const handleDelete = async () => {
    setPreview(null);
    await onSave(null); // передаем null для удаления
  };

  return (
    <div className="editable-avatar">
      <img
        src={preview || "/default-avatar.png"}
        alt="avatar"
        style={{ width: 100, height: 100, borderRadius: "50%" }}
      />
      <div>
        <button onClick={() => fileInputRef.current?.click()}>Загрузить</button>
        {preview && <button onClick={handleDelete}>Удалить</button>}
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
