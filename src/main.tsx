import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

const CLERK_PUBLISHABLE_KEY = "pk_test_c2hhcmluZy1wb3Jwb2lzZS0xNy5jbGVyay5hY2NvdW50cy5kZXYk";

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
    <App />
  </ClerkProvider>
);
