// components/AuthForm.tsx
import { useState, type FC } from "react";
import InputField from "../InputField/InputField";
import type { SwiperClass } from "swiper/react";
import { useAuth } from "../../hooks/useAuth";

type FormData = { login: string; password: string };

interface AuthFormProps {
  notify: any;
  swiper?: SwiperClass;
  isUserLoading?: boolean;
}

const AuthForm: FC<AuthFormProps> = ({ notify, swiper, isUserLoading }) => {
  const [formData, setFormData] = useState<FormData>({
    login: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ login?: boolean; password?: boolean }>(
    {}
  );
  const { login, loginLoading } = useAuth();

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const validateForm = (): boolean => {
    const newErrors: { login?: boolean; password?: boolean } = {};
    let valid = true;
    if (!formData.login) {
      notify({ title: "Ошибка", body: "Email обязателен", type: "error" });
      newErrors.login = true;
      valid = false;
    }
    if (!formData.password) {
      notify({ title: "Ошибка", body: "Пароль обязателен", type: "error" });
      newErrors.password = true;
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await login(formData);
      notify({ title: "Успех", body: "Вы успешно вошли", type: "success" });
      setFormData({ login: "", password: "" });
    } catch (err: any) {
      notify({
        title: "Ошибка входа",
        body: err?.response?.data?.error || "Неизвестная ошибка",
        type: "error",
      });
    }
  };

  return (
    <form className="auth__form" onSubmit={onSubmit} noValidate>
      <InputField
        name="login"
        placeholder="Login"
        type="login"
        value={formData.login}
        onChange={(val) => handleInputChange("login", val)}
        error={errors.login}
      />
      <InputField
        name="password"
        placeholder="Password"
        type="password"
        value={formData.password}
        onChange={(val) => handleInputChange("password", val)}
        error={errors.password}
      />
      <button
        type="submit"
        className="auth__btn"
        disabled={loginLoading || isUserLoading}
      >
        {loginLoading || isUserLoading ? "Входим..." : "Войти"}
      </button>
      <span className="auth__link">
        Нет аккаунта?{" "}
        <a href="#" onClick={() => swiper?.slideTo(1)}>
          Зарегистрироваться
        </a>
      </span>
    </form>
  );
};

export default AuthForm;
