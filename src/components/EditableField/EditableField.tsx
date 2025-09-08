import React, { useState } from "react";

const EditableField: React.FC<{
  label: string;
  value: any;
  onSave: (val: string) => Promise<void>;
}> = ({ label, value, onSave }) => {
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState(value);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(val);
      setEdit(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editable-field">
      <strong>{label}:</strong>
      {edit ? (
        <>
          <input value={val} onChange={(e) => setVal(e.target.value)} />
          <button onClick={handleSave} disabled={loading}>
            Сохранить
          </button>
          <button onClick={() => setEdit(false)}>Отмена</button>
        </>
      ) : (
        <>
          <span>{value || "—"}</span>
          <button onClick={() => setEdit(true)}>Изменить</button>
        </>
      )}
    </div>
  );
};

export default EditableField;
