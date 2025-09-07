import { createRoot } from "react-dom/client";
import "./index.scss";
import "./antdRedesign.scss";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import store from "./store/store";

// FONTS
import "./fonts/TildaSans-Black/TildaSans-Black.css";
import "./fonts/TildaSans-Bold/TildaSans-Bold.css";
import "./fonts/TildaSans-ExtraBold/TildaSans-ExtraBold.css";
import "./fonts/TildaSans-Light/TildaSans-Light.css";
import "./fonts/TildaSans-Medium/TildaSans-Medium.css";
import "./fonts/TildaSans-Regular/TildaSans-Regular.css";
import "./fonts/TildaSans-Semibold/TildaSans-Semibold.css";

const queryClient = new QueryClient({});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </QueryClientProvider>
);
