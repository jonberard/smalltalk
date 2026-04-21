"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth, supabase } from "@/lib/supabase";
import type { AdminUser } from "@/lib/types";

type AdminAccessContextType = {
  admin: AdminUser | null;
  userEmail: string | null;
  counts: {
    newSupportMessages: number;
  };
  loading: boolean;
  error: string | null;
  refreshAdmin: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminAccessContext = createContext<AdminAccessContextType>({
  admin: null,
  userEmail: null,
  counts: {
    newSupportMessages: 0,
  },
  loading: true,
  error: null,
  refreshAdmin: async () => {},
  signOut: async () => {},
});

export function useAdminAccess() {
  return useContext(AdminAccessContext);
}

export function AdminAccessProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [counts, setCounts] = useState({ newSupportMessages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAdmin(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setUserEmail(user.email ?? null);

    try {
      const res = await fetchWithAuth("/api/admin/me");
      const body = (await res.json().catch(() => ({}))) as {
        admin?: AdminUser | null;
        user?: { email?: string | null };
        counts?: { newSupportMessages?: number };
        error?: string;
        hint?: string;
      };

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok || !body.admin) {
        setAdmin(null);
        setCounts({ newSupportMessages: 0 });
        setError(body.hint || body.error || "Founder admin access required.");
        setLoading(false);
        return;
      }

      setAdmin(body.admin);
      setUserEmail(body.user?.email ?? user.email ?? null);
      setCounts({ newSupportMessages: body.counts?.newSupportMessages ?? 0 });
      setLoading(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not verify founder access.";
      setAdmin(null);
      setCounts({ newSupportMessages: 0 });
      setError(message);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmin();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const value = useMemo(
    () => ({
      admin,
      userEmail,
      counts,
      loading,
      error,
      refreshAdmin: () => loadAdmin({ silent: true }),
      signOut,
    }),
    [admin, userEmail, counts, loading, error],
  );

  return (
    <AdminAccessContext.Provider value={value}>
      {children}
    </AdminAccessContext.Provider>
  );
}
