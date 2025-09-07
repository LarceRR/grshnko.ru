// BackgroundContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import "./BackgroundProvider.scss";

type BackgroundType = {
  type: "image" | "video";
  src: string;
};

type BackgroundContextType = {
  background: BackgroundType | null;
};

const BackgroundContext = createContext<BackgroundContextType>({
  background: null,
});

export const useBackground = () => useContext(BackgroundContext);

type BackgroundProviderProps = {
  children: ReactNode;
};

const backgrounds: BackgroundType[] = [
  { type: "image", src: "/backgrounds/background.jpg" },
  { type: "image", src: "/backgrounds/background2.jpg" },
  { type: "image", src: "/backgrounds/background3.jpg" },
  { type: "video", src: "/backgrounds/background4.mp4" },
];

export const BackgroundProvider: React.FC<BackgroundProviderProps> = ({
  children,
}) => {
  const [background, setBackground] = useState<BackgroundType | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    setBackground(backgrounds[randomIndex]);
  }, []);

  return (
    <BackgroundContext.Provider value={{ background }}>
      {background && background.type === "video" ? (
        <video
          className="background"
          src={background.src}
          autoPlay
          muted
          loop
        />
      ) : background ? (
        <div
          className="background"
          style={{ backgroundImage: `url(${background.src})` }}
        />
      ) : null}
      {children}
    </BackgroundContext.Provider>
  );
};
