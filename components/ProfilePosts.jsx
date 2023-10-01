"use client";
import { useInfiniteQuery} from "@tanstack/react-query";
import { useParams } from "next/navigation";
import qs from "query-string";
import { useInView } from "react-intersection-observer";
import BlockLoader from "./svg/blockLoader";
import Loader from "./svg/loader";
import { useEffect } from "react";
import GlobalPost from "./globalPost";

export default function ProfilePosts({type}) {
  const { username } = useParams();
  const { ref: lastDivRef, inView } = useInView();

  const fetchPosts = async ({ pageParam = undefined }) => {
    const url = qs.stringifyUrl(
      {
        url: `/api/User/${username}/${type}`,
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
    queryKey: [username, type],
    queryFn: fetchPosts,
    staleTime: 60 * 1000 * 2,
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

  if (status === "error") {
    console.error("Error Fetching Messages: ", error);
    return <div>Error fetching messages</div>;
  }

  if (status === "loading") {
    return (
      <div className="h-[60svh] w-full grid place-items-center">
        <BlockLoader />
      </div>
    );
  }
  const posts = data?.pages?.flatMap((page) => page.items);
  if (posts?.length === 0) {
    <div className="text-lg grid place-items-center h-[60svh] w-full">
        Nothing to see here
    </div>
  }
  return (
    <div className="flex flex-col gap-[.4rem] scroll-smooth h-[60svh] overflow-y-scroll mt-4">
      {posts?.map((post, i) => {
        return (
          <GlobalPost
            divRef={i === posts?.length - 1 ? lastDivRef : null}
            key={post.id}
            post={post}
            sender={post.postedBy}
            images={post.images}
          />
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
