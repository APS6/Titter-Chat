"use client";
import { useAuthContext } from "@/context/authContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import fetchData from "@/app/lib/fetchData";
import { UploadButton } from "@uploadthing/react";

export default function CreateAccount() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tip, setTip] = useState("");
  const router = useRouter();
  const { user, accessToken } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [pfp, setPfp] = useState(user.photoURL);

  useEffect(() => {
    const fetchUsernames = async () => {
      try {
        const usersData = await fetchData("UsernamesId");
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsernames();
  }, []);

  useEffect(() => {
    const foundUser = users.find((u) => u.id === user?.uid);
    if (user && foundUser?.username) {
      router.push("/Home");
    } else {
      setLoading(false);
    }
  }, [user]);

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
    if (value.length >= 3 && value.length <= 9 && bio.length < 61) {
      setDisabled(false);
      setTip("");
    } else if (value.length < 3) {
      setDisabled(true);
      setTip("Username must be minimum 3 characters.");
    } else if (value.length > 9) {
      setDisabled(true);
      setTip("Username must be maximum 9 characters.");
    } else {
      setTip("Bio cannot be longer than 60 characters");
    }
    setUsername(value);
  };
  const bioHandler = (e) => {
    let value = e.target.value;
    if (username.length >= 3 && username.length <= 9 && value.length < 61) {
      setDisabled(false);
      setTip("");
    } else if (value.length > 60) {
      setDisabled(true);
      setTip("Bio cannot be longer than 60 characters");
    } else if (username.length < 3) {
      setDisabled(true);
      setTip("Username must be minimum 3 characters.");
    } else if (username.length > 9) {
      setDisabled(true);
      setTip("Username must be maximum 9 characters.");
    }
    setBio(value);
  };

  if (loading) {
    if (loading) {
      return (
        <div className="h-screen grid place-items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10rem"
            height="10rem"
            viewBox="0 0 24 24"
          >
            <rect width="10" height="10" x="1" y="1" fill="currentColor" rx="1">
              <animate
                id="svgSpinnersBlocksShuffle30"
                fill="freeze"
                attributeName="x"
                begin="0;svgSpinnersBlocksShuffle3b.end"
                dur="0.2s"
                values="1;13"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle31"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle38.end"
                dur="0.2s"
                values="1;13"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle32"
                fill="freeze"
                attributeName="x"
                begin="svgSpinnersBlocksShuffle39.end"
                dur="0.2s"
                values="13;1"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle33"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle3a.end"
                dur="0.2s"
                values="13;1"
              ></animate>
            </rect>
            <rect
              width="10"
              height="10"
              x="1"
              y="13"
              fill="currentColor"
              rx="1"
            >
              <animate
                id="svgSpinnersBlocksShuffle34"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle30.end"
                dur="0.2s"
                values="13;1"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle35"
                fill="freeze"
                attributeName="x"
                begin="svgSpinnersBlocksShuffle31.end"
                dur="0.2s"
                values="1;13"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle36"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle32.end"
                dur="0.2s"
                values="1;13"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle37"
                fill="freeze"
                attributeName="x"
                begin="svgSpinnersBlocksShuffle33.end"
                dur="0.2s"
                values="13;1"
              ></animate>
            </rect>
            <rect
              width="10"
              height="10"
              x="13"
              y="13"
              fill="currentColor"
              rx="1"
            >
              <animate
                id="svgSpinnersBlocksShuffle38"
                fill="freeze"
                attributeName="x"
                begin="svgSpinnersBlocksShuffle34.end"
                dur="0.2s"
                values="13;1"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle39"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle35.end"
                dur="0.2s"
                values="13;1"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle3a"
                fill="freeze"
                attributeName="x"
                begin="svgSpinnersBlocksShuffle36.end"
                dur="0.2s"
                values="1;13"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle3b"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle37.end"
                dur="0.2s"
                values="1;13"
              ></animate>
            </rect>
          </svg>
        </div>
      );
    }
  }
  if (!user) {
    router.push("/SignIn");
  }

  if (user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <span className="text-sm text-[red]">{tip}</span>
        <div className="h-68 w-80 bg-grey flex flex-col items-center py-6 px-4 rounded">
          <h2 className="text-3xl font-bold">Create Account</h2>
          {pfp ? (
            <div className="relative grid mt-2">
              <Image
                className="rounded-full w-20 h-20 object-cover"
                src={pfp}
                alt="PFP"
                width={80}
                height={80}
              />
              <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 grid place-items-center w-8 h-8 rounded-full bg-[#000000bd]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="white"
                    d="M11 13Zm-8 8q-.825 0-1.413-.588T1 19V7q0-.825.588-1.413T3 5h3.15L7.4 3.65q.275-.3.663-.475T8.874 3H13q.425 0 .713.288T14 4q0 .425-.288.713T13 5H8.875L7.05 7H3v12h16v-8q0-.425.288-.713T20 10q.425 0 .713.288T21 11v8q0 .825-.588 1.413T19 21H3ZM19 5h-1q-.425 0-.713-.288T17 4q0-.425.288-.713T18 3h1V2q0-.425.288-.713T20 1q.425 0 .713.288T21 2v1h1q.425 0 .713.288T23 4q0 .425-.288.713T22 5h-1v1q0 .425-.288.713T20 7q-.425 0-.713-.288T19 6V5Zm-8 12.5q1.875 0 3.188-1.313T15.5 13q0-1.875-1.313-3.188T11 8.5q-1.875 0-3.188 1.313T6.5 13q0 1.875 1.313 3.188T11 17.5Zm0-2q-1.05 0-1.775-.725T8.5 13q0-1.05.725-1.775T11 10.5q1.05 0 1.775.725T13.5 13q0 1.05-.725 1.775T11 15.5Z"
                  ></path>
                </svg>
              </div>
              <UploadButton
               appearance={{
                button:
                  "text-[1px] w-full h-full",
                container: "",
                allowedContent: "hidden",
              }}
                className="absolute top-1/2 left-1/2 -translate-y-[50%] -translate-x-1/2 w-7 h-7 opacity-0 overflow-hidden cursor-default rounded-full"
                endpoint="pfpUploader"
                onClientUploadComplete={(res) => {
                  setPfp(res[0].url);
                  if (
                    username.length >= 3 &&
                    username.length <= 9 &&
                    bio.length < 61
                  ) {
                    setDisabled(false);
                    setTip("");
                  } else if (bio.length > 60) {
                    setDisabled(true);
                    setTip("Bio cannot be longer than 60 characters");
                  } else if (username.length < 3) {
                    setDisabled(true);
                    setTip("Username must be minimum 3 characters.");
                  } else if (username.length > 9) {
                    setDisabled(true);
                    setTip("Username must be maximum 9 characters.");
                  }
                }}
                onUploadError={(error) => {
                  alert(`ERROR! ${error.message}`);
                }}
                onUploadBegin={(name) => {
                  setDisabled(true);
                }}
              />
            </div>
          ) : (
            <svg
              className="w-8 h-8 md:w-20 md:h-20"
              xmlns="http://www.w3.org/2000/svg"
              width="80px"
              height="80px"
              viewBox="0 0 16 16"
            >
              <path
                fill="currentColor"
                d="M16 7.992C16 3.58 12.416 0 8 0S0 3.58 0 7.992c0 2.43 1.104 4.62 2.832 6.09c.016.016.032.016.032.032c.144.112.288.224.448.336c.08.048.144.111.224.175A7.98 7.98 0 0 0 8.016 16a7.98 7.98 0 0 0 4.48-1.375c.08-.048.144-.111.224-.16c.144-.111.304-.223.448-.335c.016-.016.032-.016.032-.032c1.696-1.487 2.8-3.676 2.8-6.106zm-8 7.001c-1.504 0-2.88-.48-4.016-1.279c.016-.128.048-.255.08-.383a4.17 4.17 0 0 1 .416-.991c.176-.304.384-.576.64-.816c.24-.24.528-.463.816-.639c.304-.176.624-.304.976-.4A4.15 4.15 0 0 1 8 10.342a4.185 4.185 0 0 1 2.928 1.166c.368.368.656.8.864 1.295c.112.288.192.592.24.911A7.03 7.03 0 0 1 8 14.993zm-2.448-7.4a2.49 2.49 0 0 1-.208-1.024c0-.351.064-.703.208-1.023c.144-.32.336-.607.576-.847c.24-.24.528-.431.848-.575c.32-.144.672-.208 1.024-.208c.368 0 .704.064 1.024.208c.32.144.608.336.848.575c.24.24.432.528.576.847c.144.32.208.672.208 1.023c0 .368-.064.704-.208 1.023a2.84 2.84 0 0 1-.576.848a2.84 2.84 0 0 1-.848.575a2.715 2.715 0 0 1-2.064 0a2.84 2.84 0 0 1-.848-.575a2.526 2.526 0 0 1-.56-.848zm7.424 5.306c0-.032-.016-.048-.016-.08a5.22 5.22 0 0 0-.688-1.406a4.883 4.883 0 0 0-1.088-1.135a5.207 5.207 0 0 0-1.04-.608a2.82 2.82 0 0 0 .464-.383a4.2 4.2 0 0 0 .624-.784a3.624 3.624 0 0 0 .528-1.934a3.71 3.71 0 0 0-.288-1.47a3.799 3.799 0 0 0-.816-1.199a3.845 3.845 0 0 0-1.2-.8a3.72 3.72 0 0 0-1.472-.287a3.72 3.72 0 0 0-1.472.288a3.631 3.631 0 0 0-1.2.815a3.84 3.84 0 0 0-.8 1.199a3.71 3.71 0 0 0-.288 1.47c0 .352.048.688.144 1.007c.096.336.224.64.4.927c.16.288.384.544.624.784c.144.144.304.271.48.383a5.12 5.12 0 0 0-1.04.624c-.416.32-.784.703-1.088 1.119a4.999 4.999 0 0 0-.688 1.406c-.016.032-.016.064-.016.08C1.776 11.636.992 9.91.992 7.992C.992 4.14 4.144.991 8 .991s7.008 3.149 7.008 7.001a6.96 6.96 0 0 1-2.032 4.907z"
              ></path>
            </svg>
          )}
          <form
            className="w-full flex flex-col gap-4 mt-6"
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
            <textarea
              name="Bio"
              id="bio"
              cols="20"
              rows="3"
              placeholder="Type a short bio"
              onChange={(e) => bioHandler(e)}
              className="bg-[#19191F] border-[1px] border-[#818181] p-2 focus:border-none rounded "
            ></textarea>
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
