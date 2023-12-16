"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { useAuthContext } from "@/context/authContext";
import fetchData from "@/app/lib/fetchData";
import ScrollToBottom from "react-scroll-to-bottom";
import qs from "query-string";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import DMInput from "@/components/dmInput";
import BlockLoader from "@/components/svg/blockLoader";
import Loader from "@/components/svg/loader";
import DMMessage from "@/components/dmMessage";
import ScrollDown from "@/components/svg/scrollDown";
import DMContextMenu from "@/components/dmContextMenu";
import useDMSocket from "@/app/hooks/dmSocket";

export default function DMUser({ params }) {
  const { username } = params;
  document.title = `${username} | Message | Titter The Chat App`;

  const searchParams = useSearchParams();
  const chatUserId = searchParams.get("id");

  const { ref: lastDivRef, inView } = useInView();

  const { user, accessToken } = useAuthContext();
  const [replying, setReplying] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  useDMSocket({
    userId: user?.uid,
    cUsername: username,
  });

  const chatUser = useQuery({
    queryKey: ["chatU", username],
    queryFn: () => fetchData(`chatUser/${username}/${accessToken}`),
    enabled: !!accessToken,
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
    <div className="full-height px-1 pt-1">
      <Link href={`/profile/${username}`}>
        <div className="flex gap-2 pl-2 md:pl-0 items-center">
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
      <div className="flex flex-col h-[calc(100svh-44px)] justify-between">
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
    </div>
  );
}
