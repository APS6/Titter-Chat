"use client";
import Image from "next/image";
import Link from "next/link";
import fetchData from "@/app/lib/fetchData";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/authContext";
import { getAuth, signOut } from "firebase/auth";
import { initFirebase } from "@/firebase/app";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import Ably from "ably";
import { useRouter } from "next/navigation";

const client = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = client.channels.get("dm");

export const dynamic = 'force-dynamic'
export default function Sidebar() {
  const [account, setAccount] = useState({});
  const { user, accessToken } = useAuthContext();
  const [conversations, setConversations] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState()
  const [newMessage, setNewMessage] = useState();
  const router = useRouter()
  const auth = getAuth();
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/SignIn")
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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

  if (!user){
    router.push("/SignIn")
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await fetchData("User");
        const acc = usersData.find((u) => u.id === user.uid);
        if (acc) {
          setAccount(acc);
          setUsers(usersData)
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (accessToken.length > 1){
      try {
        const messagesData = await fetchData(`messages/${accessToken}`)
        setMessages(messagesData)
      } catch (error) {
        console.error("Error fetching messages:", error);
      }}
    };
    fetchMessages();
  }, [accessToken]);

  useEffect(() => {
    if (messages && users.length > 0){
    const userIDs = [
      ...new Set([
        ...messages.map((message) => message.sentById === user.uid ? message.sentToId : message.sentById),
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
    const firstThree = sortedData.slice(0, 3)
    setConversations(firstThree);
    setFetching(false);
  }
  }, [messages, users])

  useEffect(() => {
    if (user){
    // messages the user received
    channel.subscribe(`mr_${user.uid}`, (data) => {
      const newMsg = data.data;
      setNewMessage(newMsg)
    });
    // messages the user sent
    channel.subscribe(`ms_${user.uid}`, (data) => {
      const newMsg = data.data;
      setNewMessage(newMsg);
    });}
  }, []);

  useEffect(() => {
    if (newMessage && users) {
      if (newMessage.sentById === user.uid) {
        const userIndex = conversations.findIndex(
          (convo) => convo.user.id === newMessage.sentToId
        );
        const receiver = users.find((u) => u.id === newMessage.sentToId);
        const newConvo = { user: receiver, lastMessage: newMessage };

        if (userIndex === -1) {
          if (conversations.length === 3) {
            const cut = conversations.slice(0, -1);
            const newConversation = [newConvo, ...cut];
            setConversations(newConversation);
          } else {
            const newConversation = [newConvo, ...conversations];
            setConversations(newConversation);
          }
        } else {
          const updatedConversations = [
            newConvo,
            ...conversations.slice(0, userIndex),
            ...conversations.slice(userIndex + 1),
          ];
          setConversations(updatedConversations);
        }
      } else if (newMessage.sentToId === user.uid) {
        const userIndex = conversations.findIndex(
          (convo) => convo.user.id === newMessage.sentById
        );
        const sender = users.find((u) => u.id === newMessage.sentById);
        const newConvo = { user: sender, lastMessage: newMessage };

        if (userIndex === -1) {
          if (conversations.length === 3) {
            const cut = conversations.slice(0, -1);
            const newConversation = [newConvo, ...cut];
            setConversations(newConversation);
          } else {
            const newConversation = [newConvo, ...conversations];
            setConversations(newConversation);
          }
        } else {
          const updatedConversations = [
            newConvo,
            ...conversations.slice(0, userIndex),
            ...conversations.slice(userIndex + 1),
          ];
          setConversations(updatedConversations);
        }
      }
    }
  }, [newMessage]);

  return (
    <div className="hidden md:flex h-full bg-grey w-48 flex-col items-center justify-between py-4 rounded">
      <div className="flex flex-col items-center">
        <Link className="mb-8" href={"/"}>
          <div className="flex items-center gap-2">
            <Image src="/birblogo.png" alt="Titter Logo" width="34" height="25" />
            <h3 className="text-3xl">Titter</h3>
          </div>
        </Link>
        <Link className="w-full" href="/Home">
          <div className="flex items-center gap-2">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 30 30"
                fill="none"
              >
                <path
                  d="M7.5 23.75H11.25V16.25H18.75V23.75H22.5V12.5L15 6.875L7.5 12.5V23.75ZM7.5 26.25C6.8125 26.25 6.22375 26.005 5.73375 25.515C5.24375 25.025 4.99917 24.4367 5 23.75V12.5C5 12.1042 5.08875 11.7292 5.26625 11.375C5.44375 11.0208 5.68834 10.7292 6 10.5L13.5 4.875C13.7292 4.70833 13.9688 4.58333 14.2188 4.5C14.4688 4.41667 14.7292 4.375 15 4.375C15.2708 4.375 15.5313 4.41667 15.7813 4.5C16.0313 4.58333 16.2708 4.70833 16.5 4.875L24 10.5C24.3125 10.7292 24.5575 11.0208 24.735 11.375C24.9125 11.7292 25.0008 12.1042 25 12.5V23.75C25 24.4375 24.755 25.0263 24.265 25.5163C23.775 26.0063 23.1867 26.2508 22.5 26.25H16.25V18.75H13.75V26.25H7.5Z"
                  fill="white"
                />
              </svg>
            </div>
            <span className=" text-[22px] font-mont font-bold">Home</span>
          </div>
        </Link>
        <Link className="w-full mt-2" href="/DMs">
          <div className="flex items-center gap-2">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path
                  fill="white"
                  d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5l-8-5h16zm0 12H4V8l8 5l8-5v10z"
                ></path>
              </svg>
            </div>
            <span className=" text-[22px] font-mont font-bold">Messages</span>
          </div>
        </Link>
        <div className="flex flex-col items-center mt-8">
          <h3 className="font-mont font-bold text-2xl">Chats</h3>
          {fetching ? (
            <div className="h-full w-full grid place-items-center mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="2rem"
                height="2rem"
                viewBox="0 0 24 24"
              >
                <circle cx="4" cy="12" r="3" fill="currentColor">
                  <animate
                    id="svgSpinners3DotsFade0"
                    fill="freeze"
                    attributeName="opacity"
                    begin="0;svgSpinners3DotsFade1.end-0.25s"
                    dur="0.75s"
                    values="1;.2"
                  ></animate>
                </circle>
                <circle cx="12" cy="12" r="3" fill="currentColor" opacity=".4">
                  <animate
                    fill="freeze"
                    attributeName="opacity"
                    begin="svgSpinners3DotsFade0.begin+0.15s"
                    dur="0.75s"
                    values="1;.2"
                  ></animate>
                </circle>
                <circle cx="20" cy="12" r="3" fill="currentColor" opacity=".3">
                  <animate
                    id="svgSpinners3DotsFade1"
                    fill="freeze"
                    attributeName="opacity"
                    begin="svgSpinners3DotsFade0.begin+0.3s"
                    dur="0.75s"
                    values="1;.2"
                  ></animate>
                </circle>
              </svg>
            </div>
          ) : (
            <div>
              {conversations.length !== 0 ? (
                conversations.map((convo) => {
                  const sentAt = new Date(convo.lastMessage.sentAt);
                  const currentDate = new Date();

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
                    formattedDistance = `${monthsDifference}mon`;
                  } else {
                    formattedDistance = `${yearsDifference}y`;
                  }

                  return (
                    <Link
                      href={`/DMs/${convo.user.username}`}
                      key={convo.user.id}
                    >
                      <div className="mt-4 flex items-center gap-2 w-40">
                        <Image
                          className="rounded-full w-[35px] h-[35px] object-cover"
                          src={convo.user.pfpURL}
                          alt="PFP"
                          width="35"
                          height="35"
                        />
                        <div className="flex flex-col max-w-[80%]">
                          <div className="flex items-center gap-1">
                            <h4 className=" font-raleway font-semibold text-[1.20rem]">
                              {convo.user.username}
                            </h4>
                            <span>·</span>
                            <span className="text-sm text-lightwht">
                              {formattedDistance}
                            </span>
                          </div>
                          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                            {conversations ? convo.lastMessage.content : ""}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="grid place-items-center w-full mt-4">
                  <span>No Chats</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {account.pfpURL ? (
          <Link href={`/profile/${account?.username}`}>
            <Image
              src={account?.pfpURL}
              alt="User Image"
              width="30"
              height="30"
              className="rounded-full w-[30px] h-[30px] object-cover"
            />
          </Link>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            viewBox="0 0 16 16"
          >
            <path
              fill="currentColor"
              d="M16 7.992C16 3.58 12.416 0 8 0S0 3.58 0 7.992c0 2.43 1.104 4.62 2.832 6.09c.016.016.032.016.032.032c.144.112.288.224.448.336c.08.048.144.111.224.175A7.98 7.98 0 0 0 8.016 16a7.98 7.98 0 0 0 4.48-1.375c.08-.048.144-.111.224-.16c.144-.111.304-.223.448-.335c.016-.016.032-.016.032-.032c1.696-1.487 2.8-3.676 2.8-6.106zm-8 7.001c-1.504 0-2.88-.48-4.016-1.279c.016-.128.048-.255.08-.383a4.17 4.17 0 0 1 .416-.991c.176-.304.384-.576.64-.816c.24-.24.528-.463.816-.639c.304-.176.624-.304.976-.4A4.15 4.15 0 0 1 8 10.342a4.185 4.185 0 0 1 2.928 1.166c.368.368.656.8.864 1.295c.112.288.192.592.24.911A7.03 7.03 0 0 1 8 14.993zm-2.448-7.4a2.49 2.49 0 0 1-.208-1.024c0-.351.064-.703.208-1.023c.144-.32.336-.607.576-.847c.24-.24.528-.431.848-.575c.32-.144.672-.208 1.024-.208c.368 0 .704.064 1.024.208c.32.144.608.336.848.575c.24.24.432.528.576.847c.144.32.208.672.208 1.023c0 .368-.064.704-.208 1.023a2.84 2.84 0 0 1-.576.848a2.84 2.84 0 0 1-.848.575a2.715 2.715 0 0 1-2.064 0a2.84 2.84 0 0 1-.848-.575a2.526 2.526 0 0 1-.56-.848zm7.424 5.306c0-.032-.016-.048-.016-.08a5.22 5.22 0 0 0-.688-1.406a4.883 4.883 0 0 0-1.088-1.135a5.207 5.207 0 0 0-1.04-.608a2.82 2.82 0 0 0 .464-.383a4.2 4.2 0 0 0 .624-.784a3.624 3.624 0 0 0 .528-1.934a3.71 3.71 0 0 0-.288-1.47a3.799 3.799 0 0 0-.816-1.199a3.845 3.845 0 0 0-1.2-.8a3.72 3.72 0 0 0-1.472-.287a3.72 3.72 0 0 0-1.472.288a3.631 3.631 0 0 0-1.2.815a3.84 3.84 0 0 0-.8 1.199a3.71 3.71 0 0 0-.288 1.47c0 .352.048.688.144 1.007c.096.336.224.64.4.927c.16.288.384.544.624.784c.144.144.304.271.48.383a5.12 5.12 0 0 0-1.04.624c-.416.32-.784.703-1.088 1.119a4.999 4.999 0 0 0-.688 1.406c-.016.032-.016.064-.016.08C1.776 11.636.992 9.91.992 7.992C.992 4.14 4.144.991 8 .991s7.008 3.149 7.008 7.001a6.96 6.96 0 0 1-2.032 4.907z"
            ></path>
          </svg>
        )}
        <Link href={`/profile/${account?.username}`}>
          <h2 className="font-mont text-xl">{account?.username ?? "You"}</h2>
        </Link>
        <svg
          onClick={() => handleSignOut()}
          className="cursor-pointer"
          xmlns="http://www.w3.org/2000/svg"
          width="25"
          height="25"
          viewBox="0 0 25 25"
          fill="none"
        >
          <path
            d="M5.20833 5.20833H12.5V3.125H5.20833C4.0625 3.125 3.125 4.0625 3.125 5.20833V19.7917C3.125 20.9375 4.0625 21.875 5.20833 21.875H12.5V19.7917H5.20833V5.20833ZM21.875 12.5L17.7083 8.33333V11.4583H9.375V13.5417H17.7083V16.6667L21.875 12.5Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  );
}
