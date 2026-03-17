import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  subscriptionStatus: null,
  refreshSubscription: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        console.error("Subscription check error:", error);
        return;
      }
      setSubscriptionStatus(data as SubscriptionStatus);
    } catch (err) {
      console.error("Failed to check subscription:", err);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        // Defer to avoid deadlock with auth state change
        setTimeout(() => checkSubscription(), 0);
      } else {
        setSubscriptionStatus(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkSubscription();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  // Auto-refresh subscription every 60 seconds when logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 300_000); // every 5 minutes
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscriptionStatus(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, subscriptionStatus, refreshSubscription: checkSubscription, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
