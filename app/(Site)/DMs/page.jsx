"use client";
import fetchData from "@/app/lib/fetchData";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/authContext";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInYears,
} from "date-fns";

export default function DMs() {
  const { user, accessToken } = useAuthContext();
  const [account, setAccount] = useState({});
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState();
  const [messages, setMessages] = useState();

  const getLatestMessage = (userConvo) => {
    const filter1 = messages.filter(
      (message) => message.sentToId === userConvo.id
    );
    const filter2 = messages.filter(
      (message) => message.sentById === userConvo.id
    );

    const allMessages = [...filter1, ...filter2];
    const sorted = allMessages.sort(
      (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
    );
    return sorted[0];
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await fetchData("User");
        const acc = usersData.find((u) => u.id === user.uid);
        setUsers(usersData);
        if (acc) {
          setAccount(acc);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (accessToken.length > 1) {
        try {
          const messagesData = await fetchData(`messages/${accessToken}`);
          setMessages(messagesData);
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      }
    };
    fetchMessages();
  }, [accessToken]);

  useEffect(() => {
    if (messages && users) {
      const userIDs = [
        ...new Set([
          ...messages.map((message) =>
            message.sentById === user.uid ? message.sentToId : message.sentById
          ),
        ]),
      ];
      const conversationsData = userIDs.map((userID) => {
        const userConvo = users.find((u) => u.id === userID);
        const lastMessage = getLatestMessage(userConvo);
        return { user: userConvo, lastMessage };
      });
      const sortedData = conversationsData.sort(
        (a, b) =>
          new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt)
      );
      setConversations(sortedData);
      setLoading(false);
    }
  }, [messages, users]);

  return (
    <>
      {loading ? (
        <div className="h-full w-full grid place-items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="8rem"
            height="8rem"
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
      ) : (
        <div>
          <h1 className="font-bold font-mont text-4xl">Messages</h1>
          <div className="mt-6">
            <h2 className="font-bold font-mont text-3xl mb-2">Users</h2>
            {conversations.length !== 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversations.map((convo) => {
                  const sentAt = new Date(convo.lastMessage.sentAt);
                  const currentDate = new Date();

                  let content = convo.lastMessage.content;
                  if (content.length === 0) {
                    content = "(image)";
                  }

                  let formattedDistance = "";
                  const minutesDifference = differenceInMinutes(
                    currentDate,
                    sentAt
                  );
                  const hoursDifference = differenceInHours(
                    currentDate,
                    sentAt
                  );
                  const daysDifference = differenceInDays(currentDate, sentAt);
                  const monthsDifference = differenceInMonths(
                    currentDate,
                    sentAt
                  );
                  const yearsDifference = differenceInYears(
                    currentDate,
                    sentAt
                  );

                  if (minutesDifference < 60) {
                    formattedDistance = `${minutesDifference}m`;
                  } else if (hoursDifference < 24) {
                    formattedDistance = `${hoursDifference}h`;
                  } else if (daysDifference < 365) {
                    formattedDistance = `${daysDifference}d`;
                  } else if (monthsDifference < 12) {
                    formattedDistance = `${monthsDifference}m`;
                  } else {
                    formattedDistance = `${yearsDifference}y`;
                  }
                  return (
                    <Link
                      href={`/DMs/${convo.user.username}`}
                      key={convo.user.id}
                      className="w-full p-2 bg-grey rounded"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          className="rounded-full w-[50px] h-[50px] object-cover"
                          src={convo.user.pfpURL}
                          alt="PFP"
                          width="50"
                          height="50"
                        />
                        <div className="flex flex-col w-[80%]">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className=" text-xl text-bold">
                              {convo.user.username}
                            </h4>
                            <span className="text-sm text-lightwht">
                              {formattedDistance}
                            </span>
                          </div>
                          <span className="w-full whitespace-nowrap overflow-hidden text-ellipsis">
                            {conversations ? content : ""}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-ful grid place-items-center">
                <span className="text-2xl">No messages</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
