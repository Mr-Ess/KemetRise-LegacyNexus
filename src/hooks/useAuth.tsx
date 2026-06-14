import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialDone = false;

    const finishInitial = (s: Session | null) => {
      if (initialDone) return;
      initialDone = true;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    };

    // getSession() is the most reliable way to get the initial session
    supabase.auth.getSession()
      .then(({ data: { session: s } }) => finishInitial(s))
      .catch(() => finishInitial(null));

    // onAuthStateChange handles subsequent changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!initialDone) {
        finishInitial(s);
      } else {
        setSession(s);
        setUser(s?.user ?? null);
      }
    });

    // Absolute fallback: 8 seconds max wait
    const timer = setTimeout(() => finishInitial(null), 8000);

    return () => { clearTimeout(timer); subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    window.location.href = "/";
  };

  return <Ctx.Provider value={{ user, session, loading, signOut }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
