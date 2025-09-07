// components/RegisterForm.tsx
import { useState, type FC } from "react";
import InputField from "../InputField/InputField";
import type { SwiperClass } from "swiper/react";
import { useAuth } from "../../hooks/useAuth";

type FormData = {
  username: string;
  email: string;
  password: string;
  repeatPassword: string;
};

interface RegisterFormProps {
  notify: any;
  swiper?: SwiperClass;
  isUserLoading?: boolean;
}

const RegisterForm: FC<RegisterFormProps> = ({
  notify,
  swiper,
  isUserLoading,
}) => {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    repeatPassword: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  const { register, registerLoading } = useAuth();

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, boolean>> = {};
    let valid = true;

    if (!formData.username.trim()) {
      notify({ title: "Ошибка", body: "Username обязателен", type: "error" });
      newErrors.username = true;
      valid = false;
    }

    if (!formData.email) {
      notify({ title: "Ошибка", body: "Email обязателен", type: "error" });
      newErrors.email = true;
      valid = false;
    }

    if (!formData.password) {
      notify({ title: "Ошибка", body: "Пароль обязателен", type: "error" });
      newErrors.password = true;
      valid = false;
    }

    if (formData.repeatPassword !== formData.password) {
      notify({ title: "Ошибка", body: "Пароли не совпадают", type: "error" });
      newErrors.repeatPassword = true;
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      notify({
        title: "Успех",
        body: "Вы успешно зарегистрированы",
        type: "success",
      });

      setFormData({
        username: "",
        email: "",
        password: "",
        repeatPassword: "",
      });
      setErrors({});
    } catch (err: any) {
      console.log(err);
      notify({
        title: "Ошибка регистрации",
        body: err?.response?.data?.error || "Неизвестная ошибка",
        type: "error",
      });
    }
  };

  return (
    <form className="auth__form" onSubmit={onSubmit} noValidate>
      <InputField
        name="username"
        placeholder="Username"
        type="text"
        value={formData.username}
        onChange={(val) => handleInputChange("username", val)}
        error={errors.username}
      />
      <InputField
        name="email"
        placeholder="Email"
        type="email"
        value={formData.email}
        onChange={(val) => handleInputChange("email", val)}
        error={errors.email}
      />
      <InputField
        name="password"
        placeholder="Password"
        type="password"
        value={formData.password}
        onChange={(val) => handleInputChange("password", val)}
        error={errors.password}
      />
      <InputField
        name="repeatPassword"
        placeholder="Repeat Password"
        type="password"
        value={formData.repeatPassword}
        onChange={(val) => handleInputChange("repeatPassword", val)}
        error={errors.repeatPassword}
      />
      <button
        type="submit"
        className="auth__btn"
        disabled={registerLoading || isUserLoading}
      >
        {registerLoading || isUserLoading
          ? "Регистрируем..."
          : "Зарегистрироваться"}
      </button>
      <span className="auth__link">
        Уже есть аккаунт?{" "}
        <a href="#" onClick={() => swiper?.slideTo(0)}>
          Авторизоваться
        </a>
      </span>
    </form>
  );
};

export default RegisterForm;
