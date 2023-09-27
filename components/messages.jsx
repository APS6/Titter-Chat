"use client";
import { useEffect } from "react";
import { useAuthContext } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";

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
      <div className="h-[70vh] w-full grid place-items-center">
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
    <div
      className={`flex flex-col-reverse scroll-smooth gap-[.4rem] overflow-y-scroll ${
        shrink ? "h-[65vh] sm:h-[59vh]" : "h-[70svh]"
      }`}
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
    </div>
  );
}
