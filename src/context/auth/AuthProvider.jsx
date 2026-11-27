"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }) {
  // Re-check the session every minute (and on tab focus) so permission changes
  // made by an admin show up without the user logging out and back in.
  return <SessionProvider refetchInterval={60}>{children}</SessionProvider>;
}
