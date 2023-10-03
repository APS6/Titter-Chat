"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const router = useRouter();
  return (
    <div className="w-full h-[100svh] flex flex-col justify-center items-center gap-8">
      <h2 className="text-4xl">Something went wrong!</h2>
      <div className="flex gap-2">
        <button
          className="text-lg bg-purple rounded-md text-lightwht py-2 px-4"
          onClick={() => router.back()}
        >
          Go Back
        </button>
        <button
          className="text-lg bg-purple rounded-md text-lightwht py-2 px-4"
          onClick={() => router.refresh()}
        >
          Reload
        </button>
      </div>
    </div>
  );
}
