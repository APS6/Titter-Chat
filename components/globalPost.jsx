import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/authContext";
import { format } from "date-fns";
import Image from "next/image";
import Ably from "ably";

const client = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = client.channels.get("likes");

export default function GlobalPost({ post, sender }) {
  const { user } = useAuthContext();
  console.log(sender);
  const [liked, setLiked] = useState(
    post.likes ? post.likes.some((like) => like.userId === user.uid) : false
  );
  const [likeCount, setLikeCount] = useState(post?.likes?.length ?? 0);

  const localPostedAt = new Date(post.postedAt);
  const formattedPostedAt = format(localPostedAt, "dd/MM/yyyy hh:mm a");

  useEffect(() => {
    channel.subscribe("new_like", (data) => {
      const newLikes = data.data;
      if (newLikes.postId === post.id && newLikes.userId !== user.uid) {
        if (newLikes.action === "like") {
          setLikeCount((prevCount) => prevCount + 1);
        } else if (newLikes.action === "dislike") {
          setLikeCount((prevCount) => prevCount - 1);
        }
      }
    });

    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, []);

  const likeHandler = async (action) => {
    if (action === "like") {
      const body = {
        userId: user.uid,
        postId: post.id,
      };
      try {
        const response = await fetch("/api/LikePost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (response.status !== 200) {
          console.log("something went wrong");
        } else {
          console.log("Liked Post successfully");
          setLiked(true);
          setLikeCount((prevCount) => prevCount + 1);
        }
      } catch (error) {
        console.log("there was an error liking", error);
      }
    } else if (action === "dislike") {
      const body = {
        userId: user.uid,
        postId: post.id,
      };
      try {
        const response = await fetch("/api/LikePost", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (response.status !== 200) {
          console.log("something went wrong");
        } else {
          console.log("Removed Like successfully");
          setLiked(false);
          setLikeCount((prevCount) => prevCount - 1);
        }
      } catch (error) {
        console.log("there was an error disliking", error);
      }
    }
  };

  return (
    <div className="bg-grey flex items-start gap-2 p-2 rounded" key={post.id}>
      <Image
        src={sender?.pfpURL}
        alt="D"
        width="30"
        height="30"
        className="rounded-full"
      />
      <div className="">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-raleway font-semibold leading-none">
            {sender?.username ?? "DELETED"}
          </h3>
          <span className="text-sm text-lightwht">{formattedPostedAt}</span>
        </div>
        <p className="mb-1">{post?.content ?? "Could not find post"}</p>
        <div className="flex">
          <div className="flex gap-1 items-center">
            {liked ? (
              <svg
                className="cursor-pointer"
                onClick={() => likeHandler("dislike")}
                xmlns="http://www.w3.org/2000/svg"
                width="16px"
                height="16px"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="m12 21l-1.45-1.3q-2.525-2.275-4.175-3.925T3.75 12.812Q2.775 11.5 2.388 10.4T2 8.15Q2 5.8 3.575 4.225T7.5 2.65q1.3 0 2.475.55T12 4.75q.85-1 2.025-1.55t2.475-.55q2.35 0 3.925 1.575T22 8.15q0 1.15-.388 2.25t-1.362 2.412q-.975 1.313-2.625 2.963T13.45 19.7L12 21Z"
                ></path>
              </svg>
            ) : (
              <svg
                className="cursor-pointer"
                onClick={() => likeHandler("like")}
                xmlns="http://www.w3.org/2000/svg"
                width="16px"
                height="16px"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3C4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5C22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1l-.1-.1C7.14 14.24 4 11.39 4 8.5C4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5c0 2.89-3.14 5.74-7.9 10.05z"
                ></path>
              </svg>
            )}
            <span>{likeCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
