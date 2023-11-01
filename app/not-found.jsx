"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotFound() {

  const router = useRouter();

  return (
    <div className="w-full h-[100svh] flex flex-col justify-center items-center gap-8">
      <h2 className="text-4xl text-bold">Oops! page not found</h2>
      <div className="flex gap-2">
        <button
          className="text-lg bg-purple rounded-md py-2 px-4"
          onClick={() => router.back()}
        >
          Go Back
        </button>
        <Link href="/Home">
        <button
          className="text-lg bg-purple rounded-md py-2 px-4"
        >
          Home
        </button>
        </Link>
      </div>
    </div>
  );
}
