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
  const [found, setFound] = useState(true);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [shrink, setShrink] = useState(false);
  const sortMessages = (Messages) => {
    return [...Messages].sort(
      (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
    );
  };
  useEffect(() => {
    if (accessToken.length > 1) {
      const fetchUsers = async () => {
        try {
          const usersData = await fetchData(
            `2Users/${accessToken}/${username}`
          );
          setUsers(usersData);
          const currentU = usersData.find((u) => u.id === user.uid);
          const chatU = usersData.find((u) => u.username === username);
          if (!currentU || !user) {
            router.push("/SignIn");
          }
          if (!chatU) {
            setFetching(false);
            setFound(false);
          } else {
            const follows = currentU.followedBy.find(
              (u) => u.followerId === chatU.id
            );
            if (follows) {
              setCurrentUser(currentU);
              setChatUser(chatU);
            } else {
              setInputDisabled(true);
            }
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchUsers();
    }
  }, [accessToken]);

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
  
  const scroll = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  };
  useEffect(() => {
    if (user) {
      channel.subscribe(`m_${user.uid}_${username}`, (data) => {
        const newMessage = data.data;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });
      channel.subscribe(`m_${user.uid}`, (data) => {
        const newMessage = data.data;
        if (newMessage.sentByUsername === username) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      });
    }

    client.connection.on("disconnected", () => {
      alert("Realtime disconnected. Try checking network and refreshing");
    });

    return () => {
      channel.unsubscribe();
      client.connection.off();
      client.close();
    };
  }, []);

  if (!found) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center gap-8">
        <h2 className="text-4xl">User does not exist</h2>
        <button
          className="text-lg bg-purple rounded-md text-lightwht py-2 px-4"
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>
    );
  } else {
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
                  className="rounded-full w-[35px] h-[35px] object-cover"
                />
              ) : (
                ""
              )}
              <h2 className="font-bold font-mont text-4xl">{username}</h2>
            </div>
          </Link>
          <div
            className={`flex flex-col gap-4 scroll-smooth overflow-y-scroll ${
              shrink ? "h-[65vh] sm:h-[59vh]" : "h-[70svh]"
            }`}
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
                const images = message.images;
                return (
                  <div
                    key={message.id}
                    className={` flex flex-col gap-1 max-w-[75%] ${
                      received ? "self-start items-start" : "self-end items-end"
                    }`}
                  >
                    {message.content.length !== 0 ? (
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
                    ) : (
                      ""
                    )}
                    {images
                      ? images.map((image) => {
                          return (
                            <Link
                              href={image.imageUrl}
                              key={image.id}
                              className="w-full"
                            >
                              <Image
                                className="object-contain rounded w-full h-auto"
                                src={image.imageUrl}
                                alt="Image"
                                width="300"
                                height="300"
                                sizes="(max-width: 768px) 75vw,(max-width: 1000px) 48vw, 474px"
                                onLoadingComplete={scroll()}
                              />
                            </Link>
                          );
                        })
                      : ""}
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
        <DMInput
          sendingTo={chatUser.id}
          cUsername={username}
          username={currentUser?.username}
          disabled={inputDisabled}
          setShrink={setShrink}
        />
      </div>
    );
  }
}
