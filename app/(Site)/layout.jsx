"use client";

import { AuthContextProvider } from "@/context/authContext";
import Navigation from "@/components/navigation";
import { useEffect } from "react";
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
import { redirect, usePathname, useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { getMessaging, onMessage, isSupported } from "firebase/messaging";
import BellIcon from "@/components/svg/bellIcon";
const queryClient = new QueryClient();

export default function Layout({ children }) {
  const auth = getAuth(initFirebase());
  const [user, loading, error] = useAuthState(auth);
  const pathname = usePathname();
  const router = useRouter();
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
          if (
            pathname !== "/settings" &&
            Notification.permission === "default"
          ) {
            toast(
              "Don't miss a thing! Enable notifications for instant updates.",
              {
                duration: 6000,
                icon: <BellIcon />,
                action: {
                  label: "Enable now!",
                  onClick: () => {
                    router.push("/settings");
                  },
                },
                cancel: {
                  label: "Not now",
                },
              }
            );
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
