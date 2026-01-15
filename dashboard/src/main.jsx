import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { InsforgeProvider, getInsforgeRoutes } from "@insforge/react-router";
import App from "./App.jsx";
import { getInsforgeBaseUrl } from "./lib/config.js";
import { insforgeAuthClient } from "./lib/insforge-auth-client.js";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "@fontsource/geist-mono/700.css";
import "@fontsource/geist-mono/900.css";
import "./styles.css";

const insforgeBaseUrl = getInsforgeBaseUrl();
const router = createBrowserRouter([
  ...getInsforgeRoutes({ baseUrl: insforgeBaseUrl, afterSignInUrl: "/" }),
  { path: "*", element: <App /> },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <InsforgeProvider client={insforgeAuthClient}>
      <RouterProvider router={router} />
    </InsforgeProvider>
  </React.StrictMode>
);
