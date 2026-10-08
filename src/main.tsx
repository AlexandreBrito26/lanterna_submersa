import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { registerSW } from "virtual:pwa-register";

// Ativa a versão nova assim que ela está pronta: o jogo deixa de mostrar um build antigo em cache
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
