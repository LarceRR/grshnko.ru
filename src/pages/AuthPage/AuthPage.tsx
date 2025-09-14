import "./AuthPage.scss";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import { useEffect, useState } from "react";
import useTheme from "../../hooks/useTheme";
import { useNotify } from "../../hooks/useNotify";
import AuthForm from "../../components/Authorization/AuthForm";
import RegistrationForm from "../../components/Registration/RegistrationForm";
import { BackgroundProvider } from "../../components/BackgroundProvider/BackgroundProvider";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "../../api/user";
import { useNavigate } from "react-router-dom";

function AuthPage() {
  const [__, _] = useTheme();
  const { notify, contextHolder } = useNotify();
  const [swiper, setSwiper] = useState<any>(null);
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
    retry: false,
    staleTime: 0, // Всегда проверять актуальность
  });

  useEffect(() => {
    if (user) navigate("/");
  }, [user]);

  return (
    <BackgroundProvider>
      <Swiper
        onSwiper={setSwiper}
        slidesPerView={1}
        allowTouchMove={true}
        centeredSlides
      >
        {contextHolder}
        <SwiperSlide>
          <div className="auth__wrapper">
            <div className="auth__card">
              <div className="auth__logo">
                <img src="/images/logo.svg" alt="logo" />
                <h2 className="auth__title">Авторизация</h2>
              </div>
              <AuthForm
                notify={notify}
                swiper={swiper}
                isUserLoading={isLoading}
              />
            </div>
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className="auth__wrapper">
            <div className="auth__card">
              <div className="auth__logo">
                <img src="/images/logo.svg" alt="logo" />
                <h2 className="auth__title">Регистрация</h2>
              </div>
              <RegistrationForm
                notify={notify}
                swiper={swiper}
                isUserLoading={isLoading}
              />
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </BackgroundProvider>
  );
}

export default AuthPage;
