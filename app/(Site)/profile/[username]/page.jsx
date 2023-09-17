"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuthContext } from "@/context/authContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import fetchData from "@/app/lib/fetchData";
import GlobalPost from "@/components/globalPost";
import BlockLoader from "@/components/svg/blockLoader";

export default function Profile() {
  const { user, accessToken } = useAuthContext();
  const { username } = useParams();
  document.title = `${username} | Titter The Chat App`;
  const [showLikes, setShowLikes] = useState(false);

  const router = useRouter();

  if (!user) {
    router.push("/SignIn");
  }

  const queryClient = useQueryClient();

  const { data, isError, isLoading, error } = useQuery({
    queryKey: ["Profile", username],
    queryFn: () => fetchData(`UserProfile/${username}/${user.uid}`),
    enabled: !!user,
  });

  const follow = useMutation({
    mutationFn: () => followHandler(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["Profile", username] })
      const previousData = queryClient.getQueryData(["Profile", username])
      if (data.following) {
        queryClient.setQueryData(["Profile", username], (old) => {
          let newData = previousData
          newData.following = false
          return newData
        })
      } else {
        queryClient.setQueryData(["Profile", username], (old) => {
          let newData = old
          newData.following = true
          return newData
        })
      }
      return { previousData }
    },
    onError: (err, v, context) => {
      console.log(err)
      queryClient.setQueryData(["Profile", username], context.previousData)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["Profile", username] })
    },
  });

  const followHandler = async () => {
    if (data.following) {
      const body = {
        followerId: user.uid,
        followingId: data.user.id,
      };
        const response = await fetch("/api/Follow", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken,
          },
          body: JSON.stringify(body),
        });
        return response;

    } else if (!data.following) {

      const body = {
        followerId: user.uid,
        followingId: data.user.id,
      };
        const response = await fetch("/api/Follow", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken,
          },
          body: JSON.stringify(body),
        });
        return response;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full grid place-items-center">
        <BlockLoader />
      </div>
    );
  }

  if (isError) {
    console.log(error);
    return (
      <div className="w-full h-full flex flex-col justify-center items-center gap-8">
        <h2 className="text-4xl">User not found</h2>
        <button
          className="text-lg bg-purple rounded-md text-lightwht py-2 px-4"
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className="flex justify-center md:justify-between items-start gap-3 md:gap-8">
          {data?.user.pfpURL ? (
            <Image
              className="w-12 h-12 md:w-32 md:h-32 object-cover rounded-full"
              src={data?.user.pfpURL}
              alt="PFP"
              width={130}
              height={130}
            />
          ) : (
            <svg
              className="w-8 h-8 md:w-32 md:h-32"
              xmlns="http://www.w3.org/2000/svg"
              width="130px"
              height="130px"
              viewBox="0 0 16 16"
            >
              <path
                fill="currentColor"
                d="M16 7.992C16 3.58 12.416 0 8 0S0 3.58 0 7.992c0 2.43 1.104 4.62 2.832 6.09c.016.016.032.016.032.032c.144.112.288.224.448.336c.08.048.144.111.224.175A7.98 7.98 0 0 0 8.016 16a7.98 7.98 0 0 0 4.48-1.375c.08-.048.144-.111.224-.16c.144-.111.304-.223.448-.335c.016-.016.032-.016.032-.032c1.696-1.487 2.8-3.676 2.8-6.106zm-8 7.001c-1.504 0-2.88-.48-4.016-1.279c.016-.128.048-.255.08-.383a4.17 4.17 0 0 1 .416-.991c.176-.304.384-.576.64-.816c.24-.24.528-.463.816-.639c.304-.176.624-.304.976-.4A4.15 4.15 0 0 1 8 10.342a4.185 4.185 0 0 1 2.928 1.166c.368.368.656.8.864 1.295c.112.288.192.592.24.911A7.03 7.03 0 0 1 8 14.993zm-2.448-7.4a2.49 2.49 0 0 1-.208-1.024c0-.351.064-.703.208-1.023c.144-.32.336-.607.576-.847c.24-.24.528-.431.848-.575c.32-.144.672-.208 1.024-.208c.368 0 .704.064 1.024.208c.32.144.608.336.848.575c.24.24.432.528.576.847c.144.32.208.672.208 1.023c0 .368-.064.704-.208 1.023a2.84 2.84 0 0 1-.576.848a2.84 2.84 0 0 1-.848.575a2.715 2.715 0 0 1-2.064 0a2.84 2.84 0 0 1-.848-.575a2.526 2.526 0 0 1-.56-.848zm7.424 5.306c0-.032-.016-.048-.016-.08a5.22 5.22 0 0 0-.688-1.406a4.883 4.883 0 0 0-1.088-1.135a5.207 5.207 0 0 0-1.04-.608a2.82 2.82 0 0 0 .464-.383a4.2 4.2 0 0 0 .624-.784a3.624 3.624 0 0 0 .528-1.934a3.71 3.71 0 0 0-.288-1.47a3.799 3.799 0 0 0-.816-1.199a3.845 3.845 0 0 0-1.2-.8a3.72 3.72 0 0 0-1.472-.287a3.72 3.72 0 0 0-1.472.288a3.631 3.631 0 0 0-1.2.815a3.84 3.84 0 0 0-.8 1.199a3.71 3.71 0 0 0-.288 1.47c0 .352.048.688.144 1.007c.096.336.224.64.4.927c.16.288.384.544.624.784c.144.144.304.271.48.383a5.12 5.12 0 0 0-1.04.624c-.416.32-.784.703-1.088 1.119a4.999 4.999 0 0 0-.688 1.406c-.016.032-.016.064-.016.08C1.776 11.636.992 9.91.992 7.992C.992 4.14 4.144.991 8 .991s7.008 3.149 7.008 7.001a6.96 6.96 0 0 1-2.032 4.907z"
              ></path>
            </svg>
          )}
          <div className="flex flex-col w-full">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="font-mont text-2xl sm:text-3xl md:text-4xl leading-none">
                  {username}
                </h2>
                <div className="flex gap-2">
                  <span className="text-sm">
                    {data?.followerCount} Followers
                  </span>
                  <span className="text-sm">
                    {data?.followingCount} Following
                  </span>
                </div>
              </div>
              {user.uid === data?.user.id ? (
                <Link className="md:mt-4" href="/profile/edit">
                  <button className=" bg-purple rounded-2xl py-1 px-3">
                    Edit Profile
                  </button>
                </Link>
              ) : (
                <div className="flex gap-2 md:gap-3 md:mt-4 justify-center flex-wrap text-sm md:text-base [1200px]:mr-2">
                  {data?.followedBy && data?.following ? (
                    <Link href={`/DMs/${username}`}>
                      <button className="hidden sm:block bg-opacity-0 border-2 border-lightwht py-1 px-3 rounded-2xl">
                        Message
                      </button>
                      {/* mobile button */}
                      <div className="sm:hidden border border-lightwht rounded-full p-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="25"
                          height="25"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="white"
                            d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5l-8-5h16zm0 12H4V8l8 5l8-5v10z"
                          ></path>
                        </svg>
                      </div>
                    </Link>
                  ) : (
                    ""
                  )}
                  {/* mobile buttons */}
                  <div
                    onClick={() => follow.mutate()}
                    className="sm:hidden border border-lightwht rounded-full p-1 cursor-pointer"
                  >
                    {data?.following ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25"
                        height="25"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M14 14.252V22H4a8 8 0 0 1 10-7.748ZM12 13c-3.315 0-6-2.685-6-6s2.685-6 6-6s6 2.685 6 6s-2.685 6-6 6Zm7 3.586l2.121-2.121l1.415 1.414L20.413 18l2.121 2.121l-1.414 1.415L19 19.413l-2.121 2.121l-1.415-1.414L17.587 18l-2.121-2.121l1.414-1.415L19 16.587Z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25"
                        height="25"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M13 14.062V22H4a8 8 0 0 1 9-7.938ZM12 13c-3.315 0-6-2.685-6-6s2.685-6 6-6s6 2.685 6 6s-2.685 6-6 6Zm5.793 6.914l3.535-3.535l1.415 1.414l-4.95 4.95l-3.536-3.536l1.415-1.414l2.12 2.121Z"
                        ></path>
                      </svg>
                    )}
                  </div>
                  {/* desktop buttons */}
                  <button
                    onClick={() => follow.mutate()}
                    className="hidden sm:block bg-purple rounded-2xl py-1 px-3"
                  >
                    {data?.following
                      ? "Following"
                      : data?.followedBy
                      ? "Follow Back"
                      : "Follow"}
                  </button>
                </div>
              )}
            </div>
            <div className="md:w-[70%]">
              <p className="break-words">{data?.user.bio}</p>
            </div>
          </div>
        </div>
        <div className="flex font-mont font-bold border-b-[1px] border-[#7b7b7b] items-center h-10 mt-6">
          <div
            className={`cursor-pointer relative h-full grid place-items-center w-1/2 hover:bg-grey ${
              !showLikes ? "active" : ""
            }`}
            onClick={() => setShowLikes(false)}
          >
            <span>Post</span>
          </div>
          <div
            className={`cursor-pointer relative h-full grid place-items-center w-1/2 hover:bg-grey ${
              showLikes ? "active" : ""
            }`}
            onClick={() => setShowLikes(true)}
          >
            <span>Likes</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[.4rem] scroll-smooth h-[60svh] overflow-y-scroll mt-4">
        {showLikes && data?.likes.length === 0 ? (
          <div className="w-full h-full grid place-items-center">
            <span className="text-2xl">Nothing to see here</span>
          </div>
        ) : showLikes ? (
          data?.likes.map((like) => {
            return (
              <GlobalPost
                key={like.post.id}
                post={like.post}
                sender={like.post.postedBy}
                images={like.post.images}
              />
            );
          })
        ) : !showLikes ? (
          data?.posts.map((post) => {
            return (
              <GlobalPost
                key={post.id}
                post={post}
                sender={post.postedBy}
                images={post.images}
              />
            );
          })
        ) : (
          <div className="w-full h-full grid place-items-center">
            <span className="text-2xl">Nothing to see here</span>
          </div>
        )}
      </div>
    </div>
  );
}
