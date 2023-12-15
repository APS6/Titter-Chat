"use client";

import { AuthContextProvider } from "@/context/authContext";
import Navigation from "@/components/navigation";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "../api/uploadthing/core";
import { Toaster } from "sonner";
import { ContextProvider } from "@/context/context";
import { initFirebase } from "@/firebase/app";
import { getAuth } from "firebase/auth";
import { redirect } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { AblyProvider } from "ably/react";
import * as Ably from "ably";
const queryClient = new QueryClient();

export default function Layout({ children }) {
  const auth = getAuth(initFirebase());
  const [user, loading, error] = useAuthState(auth);
  let client = null;

  try {
    if (!!user?.uid) {
      client = Ably.Realtime.Promise({
        authUrl: `/api/ablyToken/${user?.uid}`,
      });
    }
  } catch (error) {
    console.error("Error initializing Ably client:", error);
  }

  if (!user && !loading && !error) {
    redirect("/SignIn");
  }

  return (
    <body className="bg-[#000]">
      <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
      <QueryClientProvider client={queryClient}>
        <AuthContextProvider>
          <AblyProvider client={client}>
            <Navigation />
            <main className="w-full md:w-[70%] max-w-4xl m-auto md:ml-52 lg:ml-60 h-full">
              <ContextProvider>
                {children}
                <Analytics />
                <SpeedInsights />
              </ContextProvider>
            </main>
          </AblyProvider>
        </AuthContextProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
      <Toaster
        theme="dark"
        richColors
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />
    </body>
  );
}
