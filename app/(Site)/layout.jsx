'use client'

import { AuthContextProvider } from "@/context/authContext";
import Navigation from "@/components/navigation";
import Loading from "./loading";
import { Suspense } from "react";
import { Analytics } from '@vercel/analytics/react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";


const queryClient = new QueryClient()

export default function RootLayout({ children }) {
  return (
      <body className="bg-[#000]">
      <QueryClientProvider client={queryClient}>
        <AuthContextProvider>
          <div className="h-[100svh] w-full p-4 flex flex-col md:flex-row gap-4">
            <Navigation />
            <main className="w-full md:w-3/4 max-w-4xl m-auto md:px-5 h-full">
              <Suspense fallback={<Loading />}>
                {children}
                <Analytics />
              </Suspense>
            </main>
          </div>
        </AuthContextProvider>
        <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
  );
}
