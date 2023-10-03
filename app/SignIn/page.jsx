"use client";

import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { initFirebase } from "@/firebase/app";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import fetchData from "../lib/fetchData";
import BlockLoader from "@/components/svg/blockLoader";

export default function SignIn() {
  const router = useRouter();
  const auth = getAuth();
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    if (user) {
      const fetchUsers = async () => {
        try {
          const userData = await fetchData(`UserExists/${user?.uid}`);
          if (userData) {
            router.push("/Home");
          } else if (userData === null) {
            router.push("/SignIn/CreateAccount");
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchUsers();
    }
  }, [user]);

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };
  if (loading) {
    return (
      <div className="h-screen grid place-items-center">
        <BlockLoader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen grid place-items-center">
        <div className="bg-grey flex flex-col items-center p-6 gap-6 shadow-[rgb(147_175_205_/_30%)_0_0_0_3px] rounded">
          <h2 className="text-2xl font-bold">Login or Signup</h2>
          <button
            onClick={() => signInWithGoogle()}
            className="p-4 text-lg flex bg-[#19191F] border-[1px] border-[#818181] rounded-lg gap-2 items-center"
          >
            <Image
              src="/google.png"
              alt="G"
              width={20}
              height={20}
              className="h-[20px]"
            />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }
}
