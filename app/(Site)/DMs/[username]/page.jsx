"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { useAuthContext } from "@/context/authContext";
import fetchData from "@/app/lib/fetchData";
import ScrollToBottom from "react-scroll-to-bottom";
import { format } from "date-fns";
import Ably from "ably";
import * as Dialog from "@radix-ui/react-dialog";
import qs from "query-string";

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import DMInput from "@/components/dmInput";
import BlockLoader from "@/components/svg/blockLoader";
import Loader from "@/components/svg/loader";

const ably = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = ably.channels.get("dm");

export default function DMUser({ params }) {
  const { username } = params;
  const router = useRouter();
  document.title = `${username} DM | Titter The Chat App`;

  const { user, accessToken } = useAuthContext();

  const queryClient = useQueryClient();

  const [shrink, setShrink] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState();

  const { ref: lastDivRef, inView } = useInView();

  const chatUser = useQuery({
    queryKey: ["chatU", username],
    queryFn: () => fetchData(`chatUser/${username}/${accessToken}`),
    enabled: !!accessToken,
  });

  const fetchMessages = async ({ pageParam = undefined }) => {
    const url = qs.stringifyUrl(
      {
        url: `/api/DM/${accessToken}/${chatUser?.data?.user?.id}`,
        query: {
          cursor: pageParam,
        },
      },
      { skipNull: true }
    );

    const res = await fetch(url, { method: "GET", cache: "no-store" });
    return res.json();
  };

  let enableFetch = chatUser?.data?.user?.id;

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
  } else {
    const messages = data?.pages?.flatMap((page) => page.items);
    return (
      <div>
          <Link className="fixed top-16 md:top-4 md:ml-3 bg-[#000] z-20" href={`/profile/${username}`}>
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
            scrollViewClassName="flex flex-col-reverse gap-[.4rem] pt-1"
          >
            {status !== "loading" ? (
              messages?.map((message, i) => {
                let received = false;
                if (message.sentToId === user?.uid) {
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
                    ref={i === messages.length - 1 ? lastDivRef : null}
                    className={` flex flex-col gap-1 max-w-[75%] ${
                      received ? "self-start items-start" : "self-end items-end"
                    }`}
                  >
                    {message.content.length !== 0 ? (
                      <div
                        className={`bg-grey rounded-3xl px-4 py-4 max-w-full${
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
                            <div key={image.id} className="rounded bg-grey">
                              <Image
                                onClick={() => (
                                  setSelectedUrl(image.imageUrl),
                                  setDialogOpen(true)
                                )}
                                className="object-contain rounded max-w-300px cursor-pointer"
                                src={image.imageUrl}
                                alt="Image"
                                width="300"
                                height="300"
                                sizes="(max-width: 768px) 75vw,(max-width: 1000px) 48vw, 300px"
                              />
                            </div>
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
          setShrink={setShrink}
        />
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-[#000000] opacity-90" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Image
                className="object-contain"
                src={selectedUrl}
                alt="Image"
                width="1000"
                height="1000"
                sizes="95vw"
              />
              <a
                className="text-md text-[#4270d1] mt-1"
                href={selectedUrl}
                target="blank"
              >
                Open in Browser
              </a>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    );
  }
}
