"use client";
import { useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/context/authContext";
import { useRouter } from "next/navigation";
import fetchData from "@/app/lib/fetchData";
import DMInput from "@/components/dmInput";
import { format } from "date-fns";
import Ably from "ably";
import Image from "next/image";
import Link from "next/link";

const client = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = client.channels.get("dm");

export default function DMUser({ params }) {
  const { username } = params;
  const router = useRouter();
  document.title = `${username} DM | Titter The Chat App`;
  const { user, accessToken } = useAuthContext();

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [chatUser, setChatUser] = useState({});
  const [fetching, setFetching] = useState(true);
  const messagesRef = useRef(null);

  const sortMessages = (Messages) => {
    return [...Messages].sort(
      (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
    );
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await fetchData("User");
        setUsers(usersData);
        const exist = usersData.find((u) => u.id === user.uid);
        const user2 = usersData.find((u) => u.username === username);
        if (!exist || !user) {
          router.push("/SignIn");
        }
        if (!user2) {
          setFetching(false);
          return (
            <div className="h-full w-full grid place-items-center text-4xl">
              <span>User Does Not Exist</span>
            </div>
          );
        }
        setCurrentUser(exist);
        setChatUser(user2);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (user.uid && chatUser.id) {
          const messageData = await fetchData(
            `DM/${accessToken}/${chatUser.id}`
          );
          if (messageData.length !== 0) {
            setMessages(sortMessages(messageData));
          }
          setFetching(false);
        }
      } catch (error) {
        setFetching(false);
        console.error("Error fetching Messages", error);
      }
    };
    fetchMessages();
  }, [chatUser]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    channel.subscribe(`m_${user?.uid}_${username}`, (data) => {
      const newMessage = data.data;
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });
    channel.subscribe(`m_${user?.uid}`, (data) => {
      const newMessage = data.data;
      if (newMessage.sentById === chatUser.id) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    });

    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, []);

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <Link href={`/profile/${username}`}>
          <div className="mb-8 flex gap-4 items-center">
            {chatUser.pfpURL ? (
              <Image
                src={chatUser.pfpURL}
                alt={"PFP"}
                width={35}
                height={35}
                className="rounded-full"
              />
            ) : (
              ""
            )}
            <h2 className="font-bold font-mont text-4xl">{username}</h2>
          </div>
        </Link>
        <div
          className="flex flex-col gap-4 scroll-smooth h-[70svh] overflow-y-scroll"
          ref={messagesRef}
        >
          {!fetching ? (
            messages?.map((message) => {
              const sender = users.find((u) => u.id === message.sentById) || {
                username: "DELETED",
              };
              let received = false;
              if (sender.username === username) {
                received = true;
              }
              const localPostedAt = new Date(message.sentAt);
              const formattedPostedAt = format(
                localPostedAt,
                "MMM, d, yyyy, hh:mm aa"
              );
              return (
                <div
                  key={message.id}
                  className={` flex flex-col gap-1 max-w-[75%] ${
                    received ? "self-start items-start" : "self-end items-end"
                  }`}
                >
                  <div
                    className={`bg-grey rounded-3xl px-4 py-4 max-w-full
                    ${
                      received
                        ? "rounded-bl-[4px]"
                        : " bg-purple rounded-br-[4px]"
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                  </div>
                  <div
                    className={`flex ${
                      received ? "justify-start ml-1" : "justify-end mr-1"
                    }`}
                  >
                    <span className="text-xs text-lightwht">
                      {formattedPostedAt}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full w-full grid place-items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="5rem"
                height="5rem"
                viewBox="0 0 24 24"
              >
                <rect
                  width="10"
                  height="10"
                  x="1"
                  y="1"
                  fill="currentColor"
                  rx="1"
                >
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
          )}
        </div>
      </div>
      <DMInput sendingTo={chatUser.id} username={username} />
    </div>
  );
}
