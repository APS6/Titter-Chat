"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { useAuthContext } from "@/context/authContext";
import fetchData from "@/app/lib/fetchData";
import ScrollToBottom from "react-scroll-to-bottom";
import { ably } from "@/app/lib/webSocket";
import qs from "query-string";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import DMInput from "@/components/dmInput";
import BlockLoader from "@/components/svg/blockLoader";
import Loader from "@/components/svg/loader";
import DMMessage from "@/components/dmMessage";
import ScrollDown from "@/components/svg/scrollDown";
import DMContextMenu from "@/components/dmContextMenu";

export default function DMUser({ params }) {
  const { username } = params;
  document.title = `${username} | Message | Titter The Chat App`;

  const channel = ably.channels.get("dm");
  ably.connection.on("connected", () => {
    console.log("Connected to Ably!");
  });
  ably.connection.on("disconnected", () => {
    console.log("disconnected from Ably!");
  });
  const searchParams = useSearchParams();
  const chatUserId = searchParams.get("id");
  const queryClient = useQueryClient();
  const { ref: lastDivRef, inView } = useInView();

  const { user, accessToken } = useAuthContext();
  const [replying, setReplying] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const chatUser = useQuery({
    queryKey: ["chatU", username],
    queryFn: () => fetchData(`chatUser/${username}/${accessToken}`),
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
  });

  const fetchMessages = async ({ pageParam = undefined }) => {
    let id = chatUser?.data?.user?.id ?? chatUserId;
    const url = qs.stringifyUrl(
      {
        url: `/api/DM/${accessToken}/${id}`,
        query: {
          cursor: pageParam,
        },
      },
      { skipNull: true }
    );

    const res = await fetch(url, { method: "GET", cache: "no-store" });
    return res.json();
  };

  let enableFetch = chatUser?.data?.user?.id
    ? chatUser?.data?.user?.id
    : accessToken && chatUserId;
  const {
    data,
    error,
    status,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["dm", username],
    queryFn: fetchMessages,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.nextCursor === null) {
        return undefined;
      }
      return lastPage.nextCursor;
    },
    enabled: !!enableFetch,
  });

  useEffect(() => {
    if (inView && !!hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView]);

  useEffect(() => {
    console.log("messages effect");
    if (user && chatUser?.data?.user?.id) {
      channel.subscribe(`m_${user.uid}`, (newM) => {
        const newMessage = newM.data;
        console.log("Received message");
        if (newMessage.sentById === chatUser.data.user.id) {
          queryClient.setQueryData(["dm", username], (oldData) => {
            let newData = [...oldData.pages];
            newData[0] = {
              ...newData[0],
              items: [newMessage, ...newData[0].items],
            };
            return {
              pages: newData,
              pageParams: oldData.pageParams,
            };
          });
        }
      });

      channel.subscribe(`delete_dm_${user.uid}`, (nMessage) => {
        const rmMsg = nMessage.data;
        queryClient.setQueryData(["dm", username], (old) => {
          const newData = old.pages.map((pg) => {
            return {
              ...pg,
              items: pg.items.reduce((acc, p) => {
                if (p.id === rmMsg.id) {
                  return acc;
                } else if (p.reply?.replyToId === rmMsg.id) {
                  acc.push({ ...p, reply: { replyToId: null } });
                } else {
                  acc.push(p);
                }
                return acc;
              }, []),
            };
          });
          return {
            pages: newData,
            pageParams: old.pageParams,
            c: old.c ? old.c + 1 : 1,
          };
        });
      });

      channel.subscribe(`edit_dm_${user.uid}`, (nMessage) => {
        const edMsg = nMessage.data;
        queryClient.setQueryData(["dm", username], (old) => {
          const newData = old.pages.map((pg) => {
            return {
              ...pg,
              items: pg.items.reduce((acc, p) => {
                if (p.id === edMsg.id) {
                  acc.push(edMsg);
                } else if (p.reply?.replyToId === edMsg.id) {
                  acc.push({
                    ...p,
                    reply: {
                      ...p.reply,
                      replyToMessage: {
                        ...p.reply.replyToMessage,
                        content: edMsg.content,
                        edited: true,
                      },
                    },
                  });
                } else {
                  acc.push(p);
                }
                return acc;
              }, []),
            };
          });
          return {
            pages: newData,
            pageParams: old.pageParams,
            c: old.c ? old.c + 1 : 1,
          };
        });
      });
    }
    return () => {
      channel.unsubscribe();
      console.log("effect closed");
    };
  }, [user, chatUser?.data?.user?.id]);

  if (status === "error") {
    console.error("Error Fetching Messages: ", error);
    return <div>Error fetching messages</div>;
  }
  if (chatUser.status === "error") {
    console.error("Error Fetching user: ", chatUser.error);
    return <div>Error fetching user</div>;
  }

  if (chatUser?.data?.user === null) {
    notFound();
  }

  const messages = data?.pages?.flatMap((page) => page.items);

  return (
    <div className="full-height flex flex-col px-1">
      <Link className="ml-2 mt-1" href={`/profile/${username}`}>
        <div className="flex gap-2 items-center">
          {chatUser?.data?.user?.pfpURL ? (
            <Image
              src={chatUser?.data?.user?.pfpURL}
              alt={"PFP"}
              width="35"
              height="35"
              className="rounded-full w-7 h-7 md:h-[35px] md:w-[35px] object-cover"
            />
          ) : (
            ""
          )}
          <h2 className="font-bold font-mont text-[1.75rem] md:text-4xl leading-9 md:leading-[2.5rem]">
            {username}
          </h2>
        </div>
      </Link>
      <ScrollToBottom
        className="relative mt-1 overflow-y-auto"
        followButtonClassName="hidden"
        scrollViewClassName="pt-1"
      >
        {status !== "loading" ? (
          <div className="flex flex-col-reverse gap-2">
            {messages?.map((message, i) => {
              if (window.innerWidth > 768) {
                return (
                  <DMContextMenu
                    key={message.id}
                    cUsername={username}
                    divRef={i === messages.length - 1 ? lastDivRef : null}
                    message={message}
                    setReplying={setReplying}
                    setReplyingTo={setReplyingTo}
                  />
                );
              } else
                return (
                  <DMMessage
                    key={message.id}
                    cUsername={username}
                    divRef={i === messages.length - 1 ? lastDivRef : null}
                    message={message}
                    setReplying={setReplying}
                    setReplyingTo={setReplyingTo}
                  />
                );
            })}
            <ScrollDown />
            {isFetchingNextPage ? (
              <div className="py-2 w-full grid place-items-center">
                <Loader />
              </div>
            ) : (
              ""
            )}
          </div>
        ) : (
          <div className="h-[100svh] w-full grid place-items-center">
            <BlockLoader />
          </div>
        )}
      </ScrollToBottom>
      <DMInput
        sendingTo={chatUser?.data?.user?.id}
        disabled={chatUser && !chatUser?.data?.allowMessage}
        replying={replying}
        replyingTo={replyingTo}
        setReplying={setReplying}
        setReplyingTo={setReplyingTo}
        cUsername={username}
      />
    </div>
  );
}
