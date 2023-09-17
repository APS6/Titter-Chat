"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/context/authContext";
import { useRouter } from "next/navigation";

import GlobalPost from "./globalPost";

import Loader from "./svg/loader";
import BlockLoader from "./svg/blockLoader";

import Ably from "ably";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import qs from "query-string";

const ably = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = ably.channels.get("global");

export default function Messages() {
  const { user, shrink } = useAuthContext();
  const router = useRouter();

  const queryClient = useQueryClient();

  const messagesRef = useRef(null);
  const bottomRef = useRef(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(null);
  const [preserveScroll, setPreserveScroll] = useState(false);

  if (!user) {
    router.push("/SignIn");
  }

  const fetchPosts = async ({ pageParam = undefined }) => {
    const url = qs.stringifyUrl(
      {
        url: "/api/Posts",
        query: {
          cursor: pageParam,
        },
      },
      { skipNull: true }
    );

    const res = await fetch(url, { method: "GET" });
    return res.json();
  };

  const {
    data,
    error,
    status,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
  });

  useEffect(() => {
    const chatContainer = messagesRef?.current;
    if (chatContainer) {
      const handleScroll = () => {
        const isAtBottom = chatContainer.scrollTop >= -200;
        setUserScrolledUp(!isAtBottom);
        if (
          chatContainer.scrollHeight +
            chatContainer.scrollTop -
            chatContainer.clientHeight ===
            0 &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      };
      chatContainer.addEventListener("scroll", handleScroll);
      return () => {
        chatContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [messagesRef, status]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesRef && !userScrolledUp) {
        if (preserveScroll && scrollPosition && messagesRef.current.scrollHeight > scrollPosition) {
          const newScrollTop = messagesRef.current.scrollHeight - scrollPosition
          messagesRef.scrollTop =  0 - newScrollTop
        }
         setTimeout(() => {
          setPreserveScroll(false)
          bottomRef.current?.scrollIntoView({
            behavior: "smooth",
          }); 
        }, 100); 
      }
    };
    if (data?.pages?.length !== 0) {
      scrollToBottom();
    }
  }, [data?.pages[0]?.items?.length]);

  useEffect(() => {
    channel.subscribe("new_post", (post) => {
      const newPost = post.data;
      const container = messagesRef.current;
      if (container.scrollTop === 0){
      console.log("scrollHeight :",container.scrollHeight);
      setScrollPosition(container.scrollHeight);
      setPreserveScroll(true)
      }
      
      queryClient.setQueryData(["posts"], (data) => {
        let newData = [...data.pages];
        newData[0] = {
          ...newData[0],
          items: [newPost, ...newData[0].items],
        };

        return {
          pages: newData,
          pageParams: data.pageParams,
        };
      });
    });

    return () => {
      channel.unsubscribe();
      ably.connection.off();
      ably.close();
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="h-[70vh] w-full grid place-items-center">
        <BlockLoader />
      </div>
    );
  }

  if (status === "error") {
    console.error("Error Fetching Posts: ", error);
    return <div>Error fetching posts</div>;
  }

  return (
    <div
      className={`flex flex-col-reverse scroll-smooth gap-[.4rem] overflow-y-scroll ${
        shrink ? "h-[65vh] sm:h-[59vh]" : "h-[70svh]"
      }`}
      ref={messagesRef}
    >
      <div ref={bottomRef}></div>
      {data?.pages?.map((page, i) => {
        return (
          <Fragment key={i}>
            {page?.items?.map((post) => (
              <GlobalPost
                key={post.id}
                post={post}
                sender={post.postedBy}
                images={post.images}
              />
            ))}
          </Fragment>
        );
      })}
      {isFetchingNextPage ? (
        <div className="py-2 w-full grid place-items-center">
          <Loader />
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
