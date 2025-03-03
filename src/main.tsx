import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import "./antdRedesign.scss";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";
import Navigator from "./components/Navigator/Navigator";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Navigator />
      <App />
    </BrowserRouter>
  </StrictMode>
);
