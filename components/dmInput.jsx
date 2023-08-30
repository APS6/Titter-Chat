"use client";
import { useAuthContext } from "@/context/authContext";
import { useState } from "react";

export default function DMInput({ sendingTo, cUsername, username, disabled }) {
  const { user, accessToken } = useAuthContext();
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const messageHandler = (e) => {
    setMessage(e.target.value);
  };

  const sendMessage = async () => {
    if (message) {
      const body = {
        content: message,
        sentById: user.uid,
        sentToId: sendingTo,
        sentToUsername: cUsername,
        sentByUsername: username,
      };
      setLoading(true);
      setShowLoading(true);
      try {
        const response = await fetch("/api/DM", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken,
          },
          body: JSON.stringify(body),
        });
        if (response.status !== 200) {
          console.log("something went wrong");
          setLoading(false);
          const timer = setTimeout(() => {
            setShowLoading(false);
          }, 500);
        } else {
          setMessage("");
          setLoading(false);
          const timer = setTimeout(() => {
            setShowLoading(false);
          }, 500);
        }
      } catch (error) {
        console.log("there was an error submitting", error);
      }
    }
  };

  return (
    <>
      <div
        className={`relative bg-grey rounded outline-none ${
          typing ? "outline-1 outline-lightwht outline-offset-0" : ""
        }`}
      >
        <input
          disabled={disabled}
          onFocus={() => setTyping(true)}
          onBlur={() => setTyping(false)}
          onChange={(e) => messageHandler(e)}
          value={message}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          type="text"
          placeholder={disabled ? 'You can message this user' : "Send a private tit"}
          className="rounded w-[93%] py-2 px-4 bg-grey outline-none"
        />
        <div
          onClick={() => sendMessage()}
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${disabled || message.length === 0 ? "cursor-not-allowed text-[#a5a5a5]" : "cursor-pointer"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
          >
            <path
              d="M5.13333 22.6625C4.74444 22.8181 4.375 22.7838 4.025 22.5598C3.675 22.3358 3.5 22.0103 3.5 21.5833V16.3333L12.8333 14L3.5 11.6667V6.41668C3.5 5.9889 3.675 5.66301 4.025 5.43901C4.375 5.21501 4.74444 5.18118 5.13333 5.33751L23.1 12.9208C23.5861 13.1347 23.8292 13.4945 23.8292 14C23.8292 14.5056 23.5861 14.8653 23.1 15.0792L5.13333 22.6625Z"
              fill="#DADADA"
            />
          </svg>
        </div>
      </div>
      <div
        className={`fixed w-full top-0 left-0 right-0 h-1 ${
          showLoading ? "block" : "hidden"
        } ${loading ? "animate-loading" : "animate-loaded"}`}
      ></div>
    </>
  );
}
