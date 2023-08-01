"use client";
import Image from "next/image";
import Link from "next/link";
import fetchData from "@/app/lib/fetchData";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/authContext";
import { useRouter } from "next/navigation";

export default function EditProfile() {
  const [users, setUsers] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [disabled, setDisabled] = useState(true);
  const { user, accessToken } = useAuthContext();
  const [tip, setTip] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await fetchData("User");
        setUsers(usersData);
        document.title = "Edit Profile | Titter The Chat App";
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const foundUser = users.find((u) => u.id === user?.uid);
    setUserProfile(foundUser);
    setUsername(foundUser?.username);
    setBio(foundUser?.bio);
  }, [users, user]);

  const submitHandler = async (e) => {
    e.preventDefault();
    const exists = users.find((u) => u.username === username);
    if (exists?.id !== user.uid) {
      setTip("Username already exists");
    } else {
      const body = {
        id: user.uid,
        username,
        bio,
      };
      try {
        const response = await fetch("/api/EditProfile", {
          method: "POST",
          headers: { "Content-Type": "application/json", 'Authorization': accessToken, },
          body: JSON.stringify(body),
        });
        if (response.status !== 200) {
          console.log("something went wrong");
        } else {
          console.log("Updated User successfully");
          router.push(`/profile/${username}`);
        }
      } catch (error) {
        console.log("there was an error submitting", error);
      }
    }
  };

  const usernameHandler = (e) => {
    let value = e.target.value;
    if (value.length >= 3 && value.length <= 10) {
      setUsername(value);
      setDisabled(false);
      setTip("");
    } else if (value.length < 3) {
      setDisabled(true);
      setUsername(value);
      setTip("Username must be minimum 3 characters.");
    } else if (value.length > 10) {
      setDisabled(true);
      setUsername(value);
      setTip("Username must be maximum 10 characters.");
    }
  };

  const bioHandler = (e) => {
    let value = e.target.value;
    if (tip.length === 0 && value.length < 191) {
      setDisabled(false);
      setTip("")
    } else if (value.length > 190){
      setDisabled(true)
      setTip("Bio cannot be longer than 190 characters");
    }
    setBio(value);
  };

  return (
    <div className="h-full w-full grid place-items-center">
      <div className="w-full bg-grey border-[1px] border-[#7b7b7b] rounded">
        <div className="w-full bg-[#000] p-2 flex justify-between items-center border-b-[1px] border-[#7b7b7b] rounded-t">
          <h3 className="font-mont font-bold text-2xl">Edit Profile</h3>
          <Link href={`/profile/${username}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.5rem"
              height="1.5rem"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275L12 13.4Z"
              ></path>
            </svg>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          {userProfile?.pfpURL ? (
            <Image
              className=" rounded-full"
              src={userProfile?.pfpURL}
              alt="PFP"
              width={80}
              height={80}
            />
          ) : (
            <svg
              className="w-8 h-8 md:w-32 md:h-32"
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
            action="#"
            method="POST"
            onSubmit={(e) => submitHandler(e)}
            className="mt-6 flex flex-col w-56 md:w-64 items-center"
          >
            <span className="text-[red] text-sm">{tip}</span>
            <div className="flex flex-col mb-4 w-full">
              <label className="font-mont font-bold">Username</label>
              <input
                type="text"
                placeholder="type your username"
                value={username}
                onChange={(e) => usernameHandler(e)}
                className="bg-[#000] rounded border-2 border-lightwht py-1 px-2 focus:border-0"
              />
            </div>
            <div className="flex flex-col w-full">
              <label className="font-mont font-bold">Bio</label>
              <textarea
                name="Bio"
                id="bio"
                cols="20"
                rows="3"
                placeholder="type a bio"
                value={bio}
                onChange={(e) => bioHandler(e)}
                className="bg-[#000] rounded border-2 border-lightwht py-1 px-2 focus:border-0"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={disabled}
              className="p-2 text-lg bg-purple rounded-lg disabled:bg-[#5a565f] mt-6"
            >
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
