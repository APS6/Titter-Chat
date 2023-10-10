"use client";
import { Fragment, useEffect } from "react";
import { useAuthContext } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import ScrollToBottom from "react-scroll-to-bottom";
import GlobalPost from "./globalPost";

import Loader from "./svg/loader";
import BlockLoader from "./svg/blockLoader";
import ScrollDown from "./svg/scrollDown";

import { ably } from "@/app/lib/webSocket";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import qs from "query-string";
import fetchData from "@/app/lib/fetchData";

export default function Messages() {
  const { user } = useAuthContext();
  const router = useRouter();

  const channel = ably.channels.get("global");

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

    channel.subscribe("delete_post", (post) => {
      const rmPost = post.data;
      if (rmPost.removerId !== user.uid) {
        queryClient.setQueryData(["posts"], (old) => {
          let newData = [...old.pages];
          const pageIndex = newData.findIndex((pg) =>
            pg.items.some((p) => p.id === rmPost.id)
          );
          if (pageIndex !== -1) {
            newData[pageIndex].items = newData[pageIndex].items.filter(
              (p) => p.id !== rmPost.id
            );
          }
          return {
            pages: newData,
            pageParams: old.pageParams,
            c: old.c ? old.c + 1 : 0,
          };
        });
      }
    });

    channel.subscribe("edit_post", (post) => {
      const edPost = post.data;
      queryClient.setQueryData(["posts"], (old) => {
        let newData = [...old.pages];
        const pageIndex = newData.findIndex((pg) =>
          pg.items.some((p) => p.id === edPost.id)
        );
        if (pageIndex !== -1) {
          const pIndex = newData[pageIndex].items.findIndex(
            (p) => p.id === edPost.id
          );
          if (pIndex !== -1) {
            newData[pageIndex].items.splice(pIndex, 1, edPost);
          }
        }
        return {
          pages: newData,
          pageParams: old.pageParams,
          c: old.c ? old.c + 1 : 0,
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

  return (
    <ScrollToBottom
      className="h-[100svh] px-1 pb-14 pt-14 md:pt-0 relative"
      followButtonClassName="hidden"
      scrollViewClassName="flex flex-col-reverse gap-[.4rem] pt-1"
    >
      {data.pages.map((page, pageI, pages) => (
        <Fragment>
          {page.items.map((post, i) => (
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
          ))}
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
    </ScrollToBottom>
  );
}
