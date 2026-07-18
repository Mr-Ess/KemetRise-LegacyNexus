import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { getCanonicalRedirectUrl, shouldForceCanonicalHost } from "@/lib/appUrl";

if (shouldForceCanonicalHost()) {
  window.location.replace(getCanonicalRedirectUrl());
}

if (!shouldForceCanonicalHost() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}

if (!shouldForceCanonicalHost()) {
  createRoot(document.getElementById("root")!).render(<App />);
}
