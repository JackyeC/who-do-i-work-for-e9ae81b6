import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

const CLERK_PUBLISHABLE_KEY = "pk_live_Y2xlcmsuamFja3llY2xheXRvbi5jb20k";

// Clerk production keys only work on jackyeclayton.com — skip in preview/other domains
const isClerkDomain = window.location.hostname === "jackyeclayton.com" || window.location.hostname.endsWith(".jackyeclayton.com");

createRoot(document.getElementById("root")!).render(
  isClerkDomain ? (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
      <App />
    </ClerkProvider>
  ) : (
    <App />
  )
);
