"use client";

import { AuthContextProvider } from "@/context/authContext";
import Navigation from "@/components/navigation";
import {  useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "../api/uploadthing/core";
import { Toaster, toast } from "sonner";
import { ContextProvider } from "@/context/context";
import { initFirebase } from "@/firebase/app";
import { getAuth } from "firebase/auth";
import { redirect, usePathname } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { getMessaging, onMessage, isSupported } from "firebase/messaging";
const queryClient = new QueryClient();

export default function Layout({ children }) {
  const auth = getAuth(initFirebase());
  const [user, loading, error] = useAuthState(auth);
  const pathname = usePathname()

  if (!user && !loading && !error) {
    redirect("/SignIn");
  }

  useEffect(() => {
    if (user) {
      try {
        let messaging = null;

        const messagingSupported = async () => {
          try {
            const support = await isSupported();
            return support;
          } catch (error) {
            return false;
          }
        };

        if (messagingSupported()) {
          if (pathname !== "/settings" && Notification.permission === 'default') {
            toast("Don't miss a thing! Enable notifications for instant updates.", {
              duration: 10000,
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M5 19q-.425 0-.713-.288T4 18q0-.425.288-.713T5 17h1v-7q0-2.075 1.25-3.688T10.5 4.2v-.7q0-.625.438-1.063T12 2q.625 0 1.063.438T13.5 3.5v.7q2 .5 3.25 2.113T18 10v7h1q.425 0 .713.288T20 18q0 .425-.288.713T19 19H5Zm7-7.5ZM12 22q-.825 0-1.413-.588T10 20h4q0 .825-.588 1.413T12 22Zm-4-5h8v-7q0-1.65-1.175-2.825T12 6q-1.65 0-2.825 1.175T8 10v7Z"></path></svg>,
              action: {
                label: "Enable now!",
                onClick: () => {redirect('/settings')}
              },
              cancel: {
                label: "Not now",
              }
            })
          }

          messaging = getMessaging();

          onMessage(messaging, (payload) => {
            console.log("Message received. ", payload);
            toast(payload.notification.title, {
              description: payload.notification.body,
            });
          });
        }
      } catch (error) {
        console.log("ahh ffs -", error);
      }
    }
  }, [!!user]);

  return (
    <body className="bg-[#000]">
      <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
      <QueryClientProvider client={queryClient}>
        <AuthContextProvider>
          <Navigation />
          <main className="w-full md:w-[70%] max-w-4xl m-auto md:ml-52 lg:ml-60 h-full">
            <ContextProvider>
              {children}
              <Analytics />
            </ContextProvider>
          </main>
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
