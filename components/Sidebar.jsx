"use client";
import Image from "next/image";
import Link from "next/link";
import fetchData from "@/app/lib/fetchData";
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
import { usePathname, useRouter } from "next/navigation";
import Loader from "./svg/loader";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useChannel } from "ably/react";
import { toast } from "sonner";

export default function Sidebar() {
  const { user, accessToken } = useAuthContext();

  const router = useRouter();
  const pathname = usePathname();
  const auth = getAuth(initFirebase());

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/SignIn");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const queryClient = useQueryClient();

  const { data, error, isError, isLoading } = useQuery({
    queryKey: [user?.uid, "userMessages"],
    queryFn: () => fetchData(`messages/${accessToken}`),
    enabled: !!accessToken,
  });

  const updateMessages = (newMessage) => {
    queryClient.setQueryData([user?.uid, "userMessages"], (oldData) => {
      const userIndex = oldData.messages.findIndex(
        (msg) => msg.id === newMessage.id
      );
      let messages = oldData.messages;
      if (userIndex === -1) {
        if (messages.length === 3) {
          const slicedMessages = messages.slice(0, -1);
          messages = [newMessage, ...slicedMessages];
        } else {
          messages = [newMessage, ...messages];
        }
      } else {
        messages = [
          newMessage,
          ...messages.slice(0, userIndex),
          ...messages.slice(userIndex + 1),
        ];
      }
      return { user: oldData.user, messages: messages };
    });
  };
  if (user) {
    const { channel } = useChannel(`sidebar-${user.uid}`, (message) => {
      const Msg = message.data;
      updateMessages(Msg);
      if (Msg.received && `/DMs/${Msg.username}` !== pathname)
        toast(`${Msg.username} sent you a message`, {
          description: Msg.content,
          action: {
            label: "View",
            onClick: () => router.push(`/DMs/${Msg.username}?id=${Msg.id}`),
          },
        });
    });
  }

  if (isError) {
    console.log("failed fetching", error);
  }

  return (
    <div className="hidden md:block top-0 left-0 fixed h-full py-2 px-2">
      <div className="hidden md:flex h-full bg-grey w-48 flex-col items-center justify-between py-4 rounded">
        <div className="flex flex-col items-center">
          <Link className="mb-8" href={"/"}>
            <div className="flex items-center gap-2">
              <Image
                src="/newlogo.png"
                alt="Titter Logo"
                width={36}
                height={30}
              />
              <h3 className="text-3xl font-bold">Titter</h3>
            </div>
          </Link>
          <Link className="w-full" href="/Home">
            <div className="flex items-center gap-2 hover:bg-[#343434] rounded-full px-2">
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
            <div className="flex items-center gap-2 hover:bg-[#343434] rounded-full px-2">
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
          <Link className="w-full mt-2" href="/settings">
            <div className="flex items-center gap-2 hover:bg-[#343434] rounded-full px-2">
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M10.125 22q-.375 0-.65-.25t-.325-.625l-.3-2.325q-.325-.125-.613-.3t-.562-.375l-2.175.9q-.35.15-.7.038t-.55-.438L2.4 15.4q-.2-.325-.125-.7t.375-.6l1.875-1.425Q4.5 12.5 4.5 12.337v-.674q0-.163.025-.338L2.65 9.9q-.3-.225-.375-.6t.125-.7l1.85-3.225q.2-.325.55-.438t.7.038l2.175.9q.275-.2.575-.375t.6-.3l.3-2.325q.05-.375.325-.625t.65-.25h3.75q.375 0 .65.25t.325.625l.3 2.325q.325.125.613.3t.562.375l2.175-.9q.35-.15.7-.038t.55.438L21.6 8.6q.2.325.125.7t-.375.6l-1.875 1.425q.025.175.025.338v.674q0 .163-.05.338l1.875 1.425q.3.225.375.6t-.125.7l-1.85 3.2q-.2.325-.563.45t-.712-.025l-2.125-.9q-.275.2-.575.375t-.6.3l-.3 2.325q-.05.375-.325.625t-.65.25h-3.75ZM11 20h1.975l.35-2.65q.775-.2 1.438-.588t1.212-.937l2.475 1.025l.975-1.7l-2.15-1.625q.125-.35.175-.737T17.5 12q0-.4-.05-.787t-.175-.738l2.15-1.625l-.975-1.7l-2.475 1.05q-.55-.575-1.212-.962t-1.438-.588L13 4h-1.975l-.35 2.65q-.775.2-1.437.588t-1.213.937L5.55 7.15l-.975 1.7l2.15 1.6q-.125.375-.175.75t-.05.8q0 .4.05.775t.175.75l-2.15 1.625l.975 1.7l2.475-1.05q.55.575 1.213.963t1.437.587L11 20Zm1.05-4.5q1.45 0 2.475-1.025T15.55 12q0-1.45-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12q0 1.45 1.012 2.475T12.05 15.5ZM12 12Z"
                  ></path>
                </svg>
              </div>
              <span className=" text-[22px] font-mont font-bold">Settings</span>
            </div>
          </Link>
          <div className="flex flex-col items-center mt-8">
            <h3 className="font-mont font-bold text-2xl">Chats</h3>
            {isLoading ? (
              <div className="h-full w-full grid place-items-center mt-4">
                <Loader />
              </div>
            ) : (
              <div>
                {data?.messages.length !== 0 ? (
                  data?.messages.map((convo) => {
                    const sentAt = new Date(convo.sentAt);
                    const currentDate = new Date();
                    let content = convo.content;
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
                    const daysDifference = differenceInDays(
                      currentDate,
                      sentAt
                    );
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
                    } else if (daysDifference < 31) {
                      formattedDistance = `${daysDifference}d`;
                    } else if (monthsDifference < 12) {
                      formattedDistance = `${monthsDifference}mon`;
                    } else {
                      formattedDistance = `${yearsDifference}y`;
                    }

                    return (
                      <Link
                        href={`/DMs/${convo.username}?id=${convo.id}`}
                        key={convo.id}
                      >
                        <div className="mt-4 flex items-center gap-2 w-44 px-1 hover:bg-[#343434] rounded-lg">
                          <Image
                            className="rounded-full w-[35px] h-[35px] object-cover"
                            src={convo.pfpURL}
                            alt="PFP"
                            width={35}
                            height={35}
                          />
                          <div className="flex flex-col max-w-[80%]">
                            <div className="flex items-center gap-1">
                              <h4 className=" font-raleway font-semibold text-[1.20rem]">
                                {convo.username}
                              </h4>
                              <span>·</span>
                              <span className="text-sm text-lightwht">
                                {formattedDistance}
                              </span>
                            </div>
                            <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                              {content}
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
        <div className="flex items-center">
          <Link
            className="flex gap-2 p-2 rounded-full hover:bg-[#343434]"
            href={`/profile/${data?.user?.username}`}
          >
            {data?.user?.pfpURL ? (
              <Image
                src={data?.user?.pfpURL}
                alt="User Image"
                width={30}
                height={30}
                className="rounded-full w-[30px] h-[30px] object-cover"
              />
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
            <h2 className="font-mont text-xl">
              {data?.user?.username ?? "You"}
            </h2>
          </Link>
          <div
            onClick={() => handleSignOut()}
            className="cursor-pointer py-2 px-1 rounded-full hover:bg-[#343434]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
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
      </div>
    </div>
  );
}
