"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function DMUser({ params }) {
  const { username } = params;
  document.title = `${username} DM | Titter The Chat App`;

  const channel = ably.channels.get("dm");

  const router = useRouter();
  const searchParams = useSearchParams();
  const chatUserId = searchParams.get("id");
  const queryClient = useQueryClient();
  const { ref: lastDivRef, inView } = useInView();

  const { user, accessToken } = useAuthContext();

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
    if (user && chatUser?.data?.user?.id) {
      channel.subscribe(`m_${user.uid}`, (newM) => {
        const newMessage = newM.data;
        if (
          newMessage.sentToId === chatUser.data.user.id ||
          newMessage.sentById === chatUser.data.user.id
        ) {
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
          let newData = [...old.pages];
          const pageIndex = newData.findIndex((pg) =>
            pg.items.some((p) => p.id === rmMsg.id)
          );
          if (pageIndex !== -1) {
            newData[pageIndex].items = newData[pageIndex].items.filter(
              (p) => p.id !== rmMsg.id
            );
          }
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
          let newData = [...old.pages];
          const pageIndex = newData.findIndex((pg) =>
            pg.items.some((p) => p.id === edMsg.id)
          );
          if (pageIndex !== -1) {
            const pIndex = newData[pageIndex].items.findIndex(
              (p) => p.id === edMsg.id
            );
            if (pIndex !== -1) {
              newData[pageIndex].items.splice(pIndex, 1, edMsg);
            }
          }
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
  }

  const messages = data?.pages?.flatMap((page) => page.items);

  return (
    <div>
      <Link
        className="fixed top-16 md:top-4 md:ml-3 bg-[#000] z-20"
        href={`/profile/${username}`}
      >
        <div className="flex gap-4 items-center">
          {chatUser?.data?.user?.pfpURL ? (
            <Image
              src={chatUser?.data?.user?.pfpURL}
              alt={"PFP"}
              width="35"
              height="35"
              className="rounded-full w-[35px] h-[35px] object-cover"
            />
          ) : (
            ""
          )}
          <h2 className="font-bold font-mont text-4xl">{username}</h2>
        </div>
      </Link>
      <ScrollToBottom
        className="h-[100svh] px-1 pb-14 pt-[6.5rem] md:pt-14 relative"
        followButtonClassName="hidden"
        scrollViewClassName="flex flex-col-reverse gap-2 pt-1"
      >
        {status !== "loading" ? (
          messages?.map((message, i) => {
            return (
              <DMMessage
                cUsername={username}
                divRef={i === messages.length - 1 ? lastDivRef : null}
                message={message}
              />
            );
          })
        ) : (
          <div className="h-full w-full grid place-items-center">
            <BlockLoader />
          </div>
        )}
        {isFetchingNextPage ? (
          <div className="py-2 w-full grid place-items-center">
            <Loader />
          </div>
        ) : (
          ""
        )}
      </ScrollToBottom>
      <DMInput
        sendingTo={chatUser?.data?.user?.id}
        disabled={chatUser && !chatUser?.data?.following}
      />
    </div>
  );
}
