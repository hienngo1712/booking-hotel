import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { DarkModeContextProvider } from "./context/darkModeContext";
import { AuthContextProvider } from "./context/AuthContext";

const ResizeObserverOriginal = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    const wrappedCallback = (entries) => {
      requestAnimationFrame(() => callback(entries));
    };
    return new ResizeObserverOriginal(wrappedCallback);
  }
};

ReactDOM.render(
  <React.StrictMode>
    <AuthContextProvider>
      <DarkModeContextProvider>
        <App />
      </DarkModeContextProvider>
    </AuthContextProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
