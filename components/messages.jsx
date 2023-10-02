"use client";
import { useEffect } from "react";
import { useAuthContext } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import ScrollToBottom from "react-scroll-to-bottom";
import GlobalPost from "./globalPost";

import Loader from "./svg/loader";
import BlockLoader from "./svg/blockLoader";
import ScrollDown from "./svg/scrollDown";

import Ably from "ably";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import qs from "query-string";

const ably = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = ably.channels.get("global");

export default function Messages() {
  const { user, shrink } = useAuthContext();
  const router = useRouter();

  const queryClient = useQueryClient();

  if (!user) {
    router.push("/SignIn");
  }

  const { ref: lastDivRef, inView } = useInView();

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

    const res = await fetch(url, { method: "GET", cache: "no-store" });
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
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.nextCursor === null) {
        return undefined;
      }
      return lastPage.nextCursor;
    },
  });

  useEffect(() => {
    if (inView && !!hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView]);

  useEffect(() => {
    channel.subscribe("new_post", (post) => {
      const newPost = post.data;
      queryClient.setQueryData(["posts"], (oldData) => {
        let newData = [...oldData.pages];
        newData[0] = {
          ...newData[0],
          items: [newPost, ...newData[0].items],
        };

        return {
          pages: newData,
          pageParams: oldData.pageParams,
        };
      });
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="h-[100svh] w-full grid place-items-center">
        <BlockLoader />
      </div>
    );
  }

  if (status === "error") {
    console.error("Error Fetching Posts: ", error);
    return <div>Error fetching posts</div>;
  }

  const posts = data.pages?.flatMap((page) => page.items);
  return (
    <ScrollToBottom
      className='h-[100svh] px-1 pb-14 pt-14 md:pt-0 relative'
      followButtonClassName="hidden"
      scrollViewClassName="flex flex-col-reverse gap-[.4rem] pt-1"
    >
      {posts?.map((post, i) => (
        <GlobalPost
          key={post.id}
          divRef={i === posts.length - 1 ? lastDivRef : null}
          post={post}
          sender={post.postedBy}
          images={post.images}
        />
      ))}
      {isFetchingNextPage ? (
        <div className="py-2 w-full grid place-items-center">
          <Loader />
        </div>
      ) : (
        ""
      )}
      <ScrollDown />
    </ScrollToBottom>
  );
}
