"use client";

import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { initFirebase } from "@/firebase/app";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import fetchData from "../lib/fetchData";

export default function SignIn() {
  const [ username, setUsername ] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [tip, setTip] = useState("");
  const router = useRouter();
  const auth = getAuth();
  const [user, loading, error] = useAuthState(auth);
  const [users, setUsers] = useState([]);

  const usernameHandler = async (e) => {
    e.preventDefault();
    const exists = users.find(u => u.username === username);
    if (exists) {
      setTip("Username already exists")
    } else {
      const body = {
        id: user.uid,
        username,
        email: user.email,
        pfpURL: user.photoURL,
      };
      try {
        const response = await fetch("/api/User", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (response.status !== 200) {
          console.log("something went wrong");
        } else {
          console.log("Created User successfully");
          router.push("/Home")
        }
      } catch (error) {
        console.log("there was an error submitting", error);
      }
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await fetchData("User");
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const foundUser = users.find((u) => u.id === user?.uid);
    if (user && foundUser?.username) {
      router.push("/Home")
    }
  }, [users, user])

  const userHandler = (e) => {
    let value = e.target.value;
    if (value.length >= 3 && value.length <= 10) {
      setUsername(value);
      setDisabled(false);
      setTip("");
    } else if (value.length < 3) {
      setDisabled(true);
      setTip("Username must be minimum 3 characters.");
    } else if (value.length > 10) {
      setDisabled(true);
      setTip("Username must be maximum 10 characters.");
    }
  };

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
      <div className="h-screen grid place-items-center"><svg xmlns="http://www.w3.org/2000/svg" width="10rem" height="10rem" viewBox="0 0 24 24"><rect width="10" height="10" x="1" y="1" fill="currentColor" rx="1"><animate id="svgSpinnersBlocksShuffle30" fill="freeze" attributeName="x" begin="0;svgSpinnersBlocksShuffle3b.end" dur="0.2s" values="1;13"></animate><animate id="svgSpinnersBlocksShuffle31" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle38.end" dur="0.2s" values="1;13"></animate><animate id="svgSpinnersBlocksShuffle32" fill="freeze" attributeName="x" begin="svgSpinnersBlocksShuffle39.end" dur="0.2s" values="13;1"></animate><animate id="svgSpinnersBlocksShuffle33" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle3a.end" dur="0.2s" values="13;1"></animate></rect><rect width="10" height="10" x="1" y="13" fill="currentColor" rx="1"><animate id="svgSpinnersBlocksShuffle34" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle30.end" dur="0.2s" values="13;1"></animate><animate id="svgSpinnersBlocksShuffle35" fill="freeze" attributeName="x" begin="svgSpinnersBlocksShuffle31.end" dur="0.2s" values="1;13"></animate><animate id="svgSpinnersBlocksShuffle36" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle32.end" dur="0.2s" values="1;13"></animate><animate id="svgSpinnersBlocksShuffle37" fill="freeze" attributeName="x" begin="svgSpinnersBlocksShuffle33.end" dur="0.2s" values="13;1"></animate></rect><rect width="10" height="10" x="13" y="13" fill="currentColor" rx="1"><animate id="svgSpinnersBlocksShuffle38" fill="freeze" attributeName="x" begin="svgSpinnersBlocksShuffle34.end" dur="0.2s" values="13;1"></animate><animate id="svgSpinnersBlocksShuffle39" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle35.end" dur="0.2s" values="13;1"></animate><animate id="svgSpinnersBlocksShuffle3a" fill="freeze" attributeName="x" begin="svgSpinnersBlocksShuffle36.end" dur="0.2s" values="1;13"></animate><animate id="svgSpinnersBlocksShuffle3b" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle37.end" dur="0.2s" values="1;13"></animate></rect></svg></div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen grid place-items-center">
        <div className="h-60 w-72 bg-grey flex flex-col items-center p-6 rounded">
          <Image src="/birblogo.png" alt="Logo" width="65" height="45" />
          <h2 className="text-2xl font-ff1">Login or Signup</h2>
          <div className="w-full grid place-items-center h-[90%]">
            <button
              onClick={() => signInWithGoogle()}
              className="p-4 text-lg flex bg-[#19191F] border-[1px] border-[#818181] gap-2 items-center"
            >
              <Image
                src="/google.png"
                alt="G"
                width="20"
                height="20"
                className="h-[20px]"
              />
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <span className="text-sm text-[red]">{loading ? "Loading..." : tip}</span>
        <div className="h-68 w-72 bg-grey flex flex-col items-center p-6 rounded">
          <Image src="/birblogo.png" alt="Logo" width="65" height="45" />
          <h2 className="text-2xl font-ff1">Login or Signup</h2>
            <form className="w-full flex flex-col gap-4 mt-6 h-[90%]" action="#" method="POST" onSubmit={(e) => usernameHandler(e)}>
              <input
                onChange={(e) => userHandler(e)}
                type="text"
                name="name"
                placeholder="Enter a username"
                className="bg-[#19191F] border-[1px] border-[#818181] p-2 focus:border-none rounded "
              />
              <button
                type="submit"
                disabled={disabled}
                className="p-2 text-lg bg-purple rounded-lg disabled:bg-[#5a565f]"
              >
                Continue
              </button>
            </form>
        </div>
      </div>
    );
  }
}
