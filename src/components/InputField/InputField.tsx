// components/InputField.tsx
import { useState, type FC } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./InputField.scss";

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  name: string;
}

const InputField: FC<InputFieldProps> = ({
  placeholder,
  type = "text",
  value,
  onChange,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="input-wrapper">
      <input
        type={inputType}
        placeholder={placeholder}
        className={`auth__input ${error ? "auth__input-error" : ""}`}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {isPassword && (
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

export default InputField;
