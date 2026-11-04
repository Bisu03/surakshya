"use client";

import "./globals.css";
import AuthProvider from "@/context/auth/AuthProvider";
import { HOSPITAL } from "@/lib/hospitalBrand";

import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


export default function RootLayout({ children }) {
  const queryClient = new QueryClient();

  return (
    <html lang="en">
      <head>
        <title>{`${HOSPITAL.name} | Hospital Management System`}</title>
        <meta
          name="description"
          content={`${HOSPITAL.name} patient care and hospital management system`}
        />
        <meta name="theme-color" content="#1b7a34" />
        <meta property="og:title" content={HOSPITAL.name} />
        <meta
          property="og:description"
          content={`${HOSPITAL.name} patient care and hospital management system`}
        />
        <meta property="og:image" content="/favicon.png" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Toaster position="top-right" reverseOrder={false} />
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
