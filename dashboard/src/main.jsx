import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { InsforgeProvider } from "@insforge/react-router";
import App from "./App.jsx";
import { SignInRedirect } from "./pages/SignInRedirect.jsx";
import { SignUpRedirect } from "./pages/SignUpRedirect.jsx";
import { insforgeAuthClient } from "./lib/insforge-auth-client";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "@fontsource/geist-mono/700.css";
import "@fontsource/geist-mono/900.css";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/sign-in", element: <SignInRedirect /> },
  { path: "/sign-up", element: <SignUpRedirect /> },
  { path: "*", element: <App /> },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <InsforgeProvider client={insforgeAuthClient}>
      <RouterProvider router={router} />
    </InsforgeProvider>
  </React.StrictMode>
);
