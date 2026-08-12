"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { IdleTimeoutProvider } from "@/components/providers/SessionProvider";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <IdleTimeoutProvider>{children}</IdleTimeoutProvider>
    </NextAuthSessionProvider>
  );
}
