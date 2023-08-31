import "../globals.css";
import { AuthContextProvider } from "@/context/authContext";
import Navigation from "@/components/navigation";
import Loading from "./loading";
import { Suspense } from "react";
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: "Titter | The chat app",
  description:
    "Start chatting with your friends on Titter Chat. Titter is a new birb chat app which is completely different than its competitors twitter, discord and threads? Titter is just better than all of them",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#000]">
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
      </body>
    </html>
  );
}
