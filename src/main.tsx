import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import "./antdRedesign.scss";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";
import Navigator from "./components/Navigator/Navigator";
import { Provider } from "react-redux";
import store from "./store/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Navigator />
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
