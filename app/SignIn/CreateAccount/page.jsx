"use client";
import { useAuthContext } from "@/context/authContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import fetchData from "@/app/lib/fetchData";

export default function CreateAccount() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [tip, setTip] = useState("");
  const router = useRouter();
  const { user, accessToken } = useAuthContext();
  console.log(user);
  const [users, setUsers] = useState([]);

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
      router.push("/Home");
    }
  }, [users, user]);

  const submitHandler = async (e) => {
    e.preventDefault();
    const exists = users.find((u) => u.username === username);
    if (exists) {
      setTip("Username already exists");
    } else {
      const body = {
        id: user.uid,
        username,
        email: user.email,
        pfpURL: user.photoURL,
        bio,
      };
      try {
        const response = await fetch("/api/User", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken,
          },
          body: JSON.stringify(body),
        });
        if (response.status !== 200) {
          console.log("something went wrong");
        } else {
          console.log("Created User successfully");
          router.push("/Home");
        }
      } catch (error) {
        console.log("there was an error submitting", error);
      }
    }
  };

  const userHandler = (e) => {
    let value = e.target.value;
    if (value.length >= 3 && value.length <= 10 && bio.length < 191) {
      setUsername(value);
      setDisabled(false);
      setTip("");
    } else if (value.length < 3) {
      setDisabled(true);
      setTip("Username must be minimum 3 characters.");
      setUsername(value);
    } else if (value.length > 10) {
      setDisabled(true);
      setTip("Username must be maximum 10 characters.");
      setUsername(value);
    }
  };
  const bioHandler = (e) => {
    let value = e.target.value;
    if (value.length > 190) {
      setTip("Bio cannot be longer than 190 characters");
      setDisabled(true);
    } else if (tip.length !==0 && value.length < 191) {
      setDisabled(false);
      setTip("");
    }
    setBio(value);s
  };

  if (!user) {
    router.push("/SignIn");
  }

  if (user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <span className="text-sm text-[red]">{tip}</span>
        <div className="h-68 w-72 bg-grey flex flex-col items-center p-6 rounded">
          <Image src="/birblogo.png" alt="Logo" width="65" height="45" />
          <h2 className="text-2xl font-ff1">Login or Signup</h2>
          <form
            className="w-full flex flex-col gap-4 mt-6 h-[90%]"
            action="#"
            method="POST"
            onSubmit={(e) => submitHandler(e)}
          >
            <input
              onChange={(e) => userHandler(e)}
              type="text"
              name="name"
              placeholder="Enter a username"
              className="bg-[#19191F] border-[1px] border-[#818181] p-2 focus:border-none rounded "
            />
            <input
              onChange={(e) => bioHandler(e)}
              type="text"
              name="name"
              placeholder="Type a short bio"
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
