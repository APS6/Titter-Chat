import fetchData from "@/app/lib/fetchData";
import * as Tabs from "@radix-ui/react-tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Loader from "./svg/loader";
import Image from "next/image";
import Link from "next/link";
import { useAuthContext } from "@/context/authContext";

export default function FollowTabs({
  defaultValue,
  profileUsername,
  handleTabParams,
}) {
  const { user, accessToken } = useAuthContext();
  const queryClient = useQueryClient();
  const {
    data: profile,
    status,
    error,
  } = useQuery({
    queryKey: [profileUsername, "followData"],
    queryFn: () => fetchData(`User/${profileUsername}/followData`),
  });

  const followFn = async (id) => {
    const body = {
      followerId: user.uid,
      followingId: id,
    };
    try {
      const response = await fetch("/api/Follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(response.error);
      }
    } catch (error) {
      throw Error(error);
    }
  };

  const followUser = useMutation({
    mutationFn: followFn,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: [profileUsername, "followData"],
      });
      const previousData = queryClient.getQueryData([
        profileUsername,
        "followData",
      ]);
      queryClient.setQueryData([profileUsername, "followData"], (old) => {
        const newFollowers = old.followers.map((f) => {
          if (f.follower.id === id) {
            return { ...f, following: true };
          } else return f;
        });
        return {
          following: old.following,
          followers: newFollowers,
        };
      });
      return { previousData };
    },
    onError: (err, v, context) => {
      console.error(err);
      toast.error("Failed following user");
      queryClient.setQueryData(
        [profileUsername, "followData"],
        context.previousData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries([profileUsername, "followData"]);
    },
  });

  const unfollowFn = async (id) => {
    const body = {
      followerId: user.uid,
      followingId: id,
    };
    try {
      const response = await fetch("/api/Follow", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(response.error);
      }
    } catch (error) {
      throw Error(error);
    }
  };

  const unfollowUser = useMutation({
    mutationFn: unfollowFn,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: [profileUsername, "followData"],
      });
      const previousData = queryClient.getQueryData([
        profileUsername,
        "followData",
      ]);
      queryClient.setQueryData([profileUsername, "followData"], (old) => {
        const newFollowers = old.followers.map((f) => {
          if (f.follower.id === id) {
            return { ...f, following: false };
          } else return f;
        });
        const newFollowing = old.following.filter((f) => f.following.id !== id);
        return {
          following: newFollowing,
          followers: newFollowers,
        };
      });
      return { previousData };
    },
    onError: (err, v, context) => {
      console.error(err);
      toast.error("Failed unfollowing user");
      queryClient.setQueryData(
        [profileUsername, "followData"],
        context.previousData
      );
    },
  });

  if (status === "loading") {
    return (
      <div className="h-full w-full grid place-items-center">
        <Loader />
      </div>
    );
  }

  if (status === "error") {
    console.log(error);
    return (
      <div className="w-full h-full flex flex-col justify-center items-center gap-8">
        <h2 className="text-4xl">Something went wrong!</h2>
      </div>
    );
  }

  return (
    <Tabs.Root
      defaultValue={defaultValue}
      onValueChange={(value) => handleTabParams(value)}
    >
      <Tabs.List className="flex border-b- border-b-lightwht">
        <Tabs.Trigger
          className="flex-1 text-lg leading-none py-1 data-[state=active]:text-[rgb(192,132,252)] hover:text-[rgb(192,132,252)]  data-[state=active]:shadow-[inset_0_0_0_0,0_1px_0_0] data-[state=active]:shadow-current"
          value="followers"
        >
          Followers
        </Tabs.Trigger>
        <Tabs.Trigger
          className="flex-1 text-lg leading-none py-1 data-[state=active]:text-[rgb(192,132,252)] hover:text-[rgb(192,132,252)] data-[state=active]:shadow-[inset_0_0_0_0,0_1px_0_0] data-[state=active]:shadow-current"
          value="following"
        >
          Following
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="followers">
        {profile.followers.map((follow) => (
          <div
            key={follow.follower.id}
            className="flex justify-between items-center pt-3"
          >
            <div className="flex gap-2 items-center">
              <Link href={`/profile/${follow.follower.username}`}>
                <Image
                  className="rounded-full"
                  src={follow.follower.pfpURL}
                  width="30"
                  height="30"
                  alt="PFP"
                />
              </Link>
              <Link href={`/profile/${follow.follower.username}`}>
                <h3 className="text-lg hover:underline">
                  {follow.follower.username}
                </h3>
              </Link>
            </div>
            {user.uid === profile.id ? (
              follow.following ? (
                <button
                  onClick={() => unfollowUser.mutate(follow.follower.id)}
                  className=" bg-black border-1 border-white rounded-2xl py-1 px-3"
                >
                  Following
                </button>
              ) : (
                <button
                  onClick={() => followUser.mutate(follow.follower.id)}
                  className="bg-white text-black rounded-2xl py-1 px-3"
                >
                  Follow
                </button>
              )
            ) : (
              ""
            )}
          </div>
        ))}
      </Tabs.Content>
      <Tabs.Content value="following">
        {profile.following.map((follow) => (
          <div
            key={follow.following.id}
            className="flex justify-between items-center pt-3"
          >
            <div className="flex gap-2 items-center">
              <Link href={`/profile/${follow.following.username}`}>
                <Image
                  className="rounded-full"
                  src={follow.following.pfpURL}
                  width="30"
                  height="30"
                  alt="PFP"
                />
              </Link>
              <Link href={`/profile/${follow.following.username}`}>
                <h3 className="text-lg hover:underline">
                  {follow.following.username}
                </h3>
              </Link>
            </div>
            {user.uid === profile.id ? (
              <button
                onClick={() => unfollowUser.mutate(follow.following.id)}
                className=" bg-black border-1 border-white rounded-2xl py-1 px-3"
              >
                Following
              </button>
            ) : (
              ""
            )}
          </div>
        ))}
      </Tabs.Content>
    </Tabs.Root>
  );
}
