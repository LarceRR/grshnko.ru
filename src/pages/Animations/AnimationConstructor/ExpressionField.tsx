import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import "./ExpressionField.scss";

const QUICK_INSERTS: { label: string; value: string }[] = [
  { label: "sin", value: "sin()" },
  { label: "cos", value: "cos()" },
  { label: "noise", value: "noise()" },
  { label: "i", value: "i" },
  { label: "t", value: "t" },
  { label: "ledCount", value: "ledCount" },
  { label: "prev_r", value: "prev_r" },
  { label: "map", value: "map(, , , , )" },
  { label: "clamp", value: "clamp(, 0, 255)" },
  { label: "lerp", value: "lerp(, , )" },
  { label: "smoothstep", value: "smoothstep(0, 1, )" },
  { label: "hsv", value: "hsv(, 1, 1)" },
];

interface ExpressionFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  quickInserts?: boolean;
}

export default function ExpressionField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  quickInserts = true,
}: ExpressionFieldProps) {
  const [showInserts, setShowInserts] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleInsert = (text: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      const before = value.slice(0, start);
      const after = value.slice(end);
      const cursorPos = start + text.length;
      onChange(before + text + after);
      setShowInserts(false);
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(cursorPos, cursorPos);
      });
    } else {
      onChange(value + text);
      setShowInserts(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowInserts(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="expr-field">
      <div className="expr-field__header">
        <label>{label}</label>
        {hint && <span className="expr-field__hint">{hint}</span>}
        {quickInserts && (
          <div className="expr-field__insert-wrap" ref={menuRef}>
            <button
              type="button"
              className="expr-field__insert-btn"
              onClick={() => setShowInserts(!showInserts)}
              title="Вставить"
            >
              <Plus size={14} />
            </button>
            {showInserts && (
              <div className="expr-field__insert-menu">
                {QUICK_INSERTS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="expr-field__insert-item"
                    onClick={() => handleInsert(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        className="expr-field__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}
