"use client";
import { Fragment, useEffect } from "react";
import { useAuthContext } from "@/context/authContext";
import { useInView } from "react-intersection-observer";
import ScrollToBottom from "react-scroll-to-bottom";
import GlobalPost from "./globalPost";

import Loader from "./svg/loader";
import BlockLoader from "./svg/blockLoader";
import ScrollDown from "./svg/scrollDown";

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import qs from "query-string";
import useGlobalSocket from "@/app/hooks/globalChatSocket";
import fetchData from "@/app/lib/fetchData";
import PostContextMenu from "./postContextMenu";

export default function Messages() {
  const { user } = useAuthContext();

  const { ref: lastDivRef, inView } = useInView();

  useGlobalSocket();

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

  const { data: cUser } = useQuery({
    queryKey: [user?.uid, "userOverview"],
    queryFn: () => fetchData(`UserOverview/${user.uid}`),
    staleTime: 1000 * 60 * 5,
    enabled: !!user?.uid,
  });
  useEffect(() => {
    if (inView && !!hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView]);

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

  return (
    <ScrollToBottom
      className=" relative bg-grey overflow-y-auto"
      followButtonClassName="hidden"
      scrollViewClassName="pt-1"
    >
      <div className="flex flex-col-reverse gap-1">
        {data?.pages?.map((page, pageI, pages) => (
          <Fragment key={pageI}>
            {page?.items?.map((post, i) => {
              if (window.innerWidth > 768) {
                return (
                  <PostContextMenu
                    key={post.id}
                    divRef={
                      i === page.items.length - 1 && pageI === pages.length - 1
                        ? lastDivRef
                        : null
                    }
                    post={post}
                    cUser={cUser}
                  />
                );
              } else
                return (
                  <GlobalPost
                    key={post.id}
                    divRef={
                      i === page.items.length - 1 && pageI === pages.length - 1
                        ? lastDivRef
                        : null
                    }
                    post={post}
                    cUser={cUser}
                  />
                );
            })}
          </Fragment>
        ))}
        {isFetchingNextPage ? (
          <div className="py-2 w-full grid place-items-center">
            <Loader />
          </div>
        ) : (
          ""
        )}
        <ScrollDown />
      </div>
    </ScrollToBottom>
  );
}
