import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ClerkWrapper } from "./components/ClerkWrapper.tsx";
import "./index.css";

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  console.warn("⚠️ Missing Clerk Publishable Key - running without authentication");
  console.warn("⚠️ Some features may not work. Set VITE_CLERK_PUBLISHABLE_KEY in .env.local");
}

// ClerkWrapper conditionally provides ClerkProvider or just renders App
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkWrapper>
      <App />
    </ClerkWrapper>
  </StrictMode>
);