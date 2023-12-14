"use client";
import { useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/context/authContext";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Linkify from "react-linkify";
import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Popover from "@radix-ui/react-popover";
import TrashIcon from "@/components/svg/trashIcon";
import EditIcon from "@/components/svg/editIcon";
import UserIcon from "@/components/svg/userIcon";
import LinkIcon from "@/components/svg/linkIcon";
import ImageDialog from "@/components/imageDialog";
import ThreeDots from "@/components/svg/threeDots";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notFound, useParams, useRouter } from "next/navigation";
import fetchData from "@/app/lib/fetchData";
import BlockLoader from "@/components/svg/blockLoader";
import { toast } from "sonner";
import BackIcon from "@/components/svg/backIcon";
import GlobalPost from "@/components/globalPost";
import { useStateContext } from "@/context/context";
import Input from "@/components/input";
import ReplyIcon from "@/components/svg/replyIcon";
import sendRepost from "@/app/lib/repost";
import RepostIcon from "@/components/svg/repost";
import { useChannel } from "ably/react";

export default function Post() {
  const { user, accessToken } = useAuthContext();
  const { replying, setReplying, setReplyingTo } = useStateContext();
  const { postId } = useParams();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(null);

  const [selectedUrl, setSelectedUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState();
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState();
  const [content, setContent] = useState();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const textareaRef = useRef(null);
  const router = useRouter();

  const queryClient = useQueryClient();

  useChannel("likes", (message) => {
    const newLikes = message.data;
    if (newLikes.postId === post.id && newLikes.userId !== user.uid) {
      if (newLikes.action === "like") {
        setLikeCount((prevCount) => prevCount + 1);
      } else if (newLikes.action === "dislike") {
        setLikeCount((prevCount) => prevCount - 1);
      }
    }
  });

  const {
    data: post,
    isError,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchData(`Posts/${postId}`),
    enabled: !!postId && postId.length !== 0,
  });

  const { data: cUser } = useQuery({
    queryKey: [user?.uid, "userOverview"],
    queryFn: () => fetchData(`UserOverview/${user.uid}`),
    staleTime: 1000 * 60 * 5,
    enabled: !!user?.uid,
  });

  const deletePost = useMutation({
    mutationFn: () => deletePostFn(),
    onMutate: async () => {
      setPopoverOpen(false);
      router.push("/Home");
    },
    onError: (err, v, context) => {
      console.error(err);
      toast.error("Failed deleting post");
      queryClient.setQueryData(["posts"], context.previousData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["post", post.id]);
      queryClient.invalidateQueries(["posts"]);
      toast("Deleted post successfully", {
        icon: <TrashIcon />,
        duration: 2000,
      });
    },
  });

  const editPost = useMutation({
    mutationFn: () => editPostFn(),
    onError: (err, v, context) => {
      console.error(err);
      toast.error("Failed editing post");
      queryClient.setQueryData(["post", post.id], context.previousData);
    },
    onMutate: async () => {
      setEditing(false);
      setEdited(true);
      await queryClient.cancelQueries({ queryKey: ["post", post.id] });
      const previousData = queryClient.getQueryData(["post", post.id]);
      queryClient.setQueryData(["post", post.id], (old) => {
        return {
          ...old,
          content: content,
        };
      });
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
      toast("Edited post successfully", {
        icon: <EditIcon />,
        duration: 2000,
      });
    },
  });

  const deletePostFn = async () => {
    const body = {
      postId: post.id,
    };
    const response = await fetch("/api/Posts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken,
      },
      body: JSON.stringify(body),
    });
    if (response.status !== 200) {
      throw new Error(response.error);
    }
    return response;
  };

  const editPostFn = async () => {
    const body = {
      postId: post.id,
      content: content,
    };
    const response = await fetch("/api/Posts", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken,
      },
      body: JSON.stringify(body),
    });
    if (response.status !== 200) {
      throw new Error(response.error);
    }
    return response;
  };

  const likeHandler = async () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((prevCount) => prevCount + 1);
      const body = {
        userId: user.uid,
        postId: post.id,
      };
      try {
        const response = await fetch("/api/LikePost", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken,
          },
          body: JSON.stringify(body),
        });
        if (response.status !== 200) {
          console.log("something went wrong");
          setLiked(false);
          setLikeCount((prevCount) => prevCount - 1);
        } else {
          console.log("Liked Post successfully");
        }
      } catch (error) {
        console.log("there was an error liking", error);
      }
    } else if (liked) {
      setLiked(false);
      setLikeCount((prevCount) => prevCount - 1);
      const body = {
        userId: user.uid,
        postId: post.id,
      };
      try {
        const response = await fetch("/api/LikePost", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken,
          },
          body: JSON.stringify(body),
        });
        if (response.status !== 200) {
          console.log("something went wrong");
          setLiked(true);
          setLikeCount((prevCount) => prevCount + 1);
        } else {
          console.log("Removed Like successfully");
        }
      } catch (error) {
        console.log("there was an error disliking", error);
      }
    }
  };

  const editHandler = (e) => {
    setContent(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    editPost.mutate();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && editing) {
      e.preventDefault();
      editPost.mutate();
    }
  };

  const copyLink = () => {
    const type = "text/plain";
    const blob = new Blob([`titter-chat.vercel.app/post/${postId}`], { type });
    const data = [new ClipboardItem({ [type]: blob })];

    navigator.clipboard.write(data).then(
      () => {
        console.log("copied post url");
        setPopoverOpen(false);
        toast.success("Copied link to clipboard");
      },
      (err) => {
        console.error("Error copying URL :", err);
        toast.error("Failed copying link");
      }
    );
  };

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setLiked(post.likes.some((like) => like.userId === user.uid));
      setLikeCount(post.likes.length ?? 0);
    }
  }, [post?.likes, post?.content]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content, editing]);

  if (isError) {
    console.log(error);
    return (
      <div className="w-full h-[100svh] flex flex-col justify-center items-center gap-8">
        <h2 className="text-4xl">Post not found</h2>
        <button
          className="text-lg bg-purple rounded-md text-lightwht py-2 px-4"
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[100svh] w-full grid place-items-center">
        <BlockLoader />
      </div>
    );
  }
  if (post === null) {
    notFound();
  }

  const componentDecorator = (href, text, key) => (
    <a
      href={href}
      key={key}
      target="_blank"
      className="text-[#247edf] hover:underline"
    >
      {text}
    </a>
  );

  return (
    <div className="full-height flex flex-col md:py-2">
      <div className="bg-grey h-full flex flex-col overflow-y-auto rounded-s">
        <div className="flex items-center gap-2 w-full border-b border-b-[#808080] p-1">
          <div
            onClick={() => router.back()}
            className="cursor-pointer p-1 hover:bg-[#343434] rounded-full text-2xl"
          >
            <BackIcon />
          </div>
          <span className="font-bold font-mont text-xl">Post</span>
        </div>
        <ContextMenu.Root>
          <ContextMenu.Trigger className="w-full">
            <div className={`group px-2 pt-2`}>
              <div className="relative">
                <Link
                  className="flex items-center gap-2 max-w-fit"
                  href={`/profile/${post?.postedBy?.username}`}
                >
                  <Image
                    src={post?.postedBy?.pfpURL}
                    alt="D"
                    width="30"
                    height="30"
                    className="rounded-full w-[30px] h-[30px] object-cover"
                  />
                  <h3 className="text-xl font-raleway font-semibold leading-none hover:underline">
                    {post?.postedBy.username ?? "?"}
                  </h3>
                </Link>
                <Popover.Root
                  open={popoverOpen}
                  onOpenChange={(open) => setPopoverOpen(open)}
                >
                  <Popover.Trigger
                    className={`pc-opacity-0 group-hover:opacity-100 ${
                      editing ? "hidden" : ""
                    } absolute right-1 top-1 hover:bg-[#343434] rounded-full p-1`}
                  >
                    <ThreeDots />
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content className="bg-[#282828] rounded min-w-[10rem] p-1 flex flex-col gap-[2px]">
                      {post?.postedBy.username === cUser?.username ||
                      cUser?.role === "ADMIN" ? (
                        <div>
                          <div
                            onClick={() => deletePost.mutate()}
                            className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-[#ee4a4a]"
                          >
                            <TrashIcon />
                            <span>Delete</span>
                          </div>
                          {post?.postedBy.username === cUser?.username ? (
                            <div
                              onClick={() => {
                                setEditing(true);
                                setPopoverOpen(false);
                              }}
                              className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple"
                            >
                              <EditIcon />
                              <span>Edit</span>
                            </div>
                          ) : (
                            ""
                          )}
                          <div className="h-[1px] w-[97%] ml-[3px] mt-1 rounded-lg bg-[#5d5d5d]"></div>
                        </div>
                      ) : (
                        ""
                      )}
                      <div
                        onClick={() => {
                          setReplying(true);
                          setReplyingTo({
                            username: post?.postedBy.username,
                            postId: post.id,
                          });
                          setPopoverOpen(false);
                        }}
                        className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple"
                      >
                        <ReplyIcon />
                        <span>Reply</span>
                      </div>
                      <div className="rounded cursor-pointer hover:outline-0 hover:bg-purple">
                        <Link
                          className="flex items-center gap-2 p-1 w-full h-full"
                          href={`/profile/${post?.postedBy?.username}`}
                        >
                          <UserIcon />
                          <span>View Profile</span>
                        </Link>
                      </div>
                      <div
                        onClick={() => copyLink()}
                        className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple"
                      >
                        <LinkIcon />
                        <span>Copy Link</span>
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>
              {post?.content?.length !== 0 && !editing ? (
                <p className="text-[17px] mt-1 break-words whitespace-pre-wrap">
                  <Linkify componentDecorator={componentDecorator}>
                    {content ?? post?.content}
                  </Linkify>
                  {edited ? (
                    <span className=" text-lightwht text-sm ml-[2px]">
                      (edited)
                    </span>
                  ) : (
                    ""
                  )}
                </p>
              ) : editing ? (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col mt-1 gap-2"
                >
                  <textarea
                    ref={textareaRef}
                    className="outline-0 bg-[transparent] max-h-[500px] text-[17px] resize-none"
                    placeholder="type your tit"
                    rows="1"
                    onChange={(e) => editHandler(e)}
                    onKeyDown={(e) => handleKeyDown(e)}
                    value={content}
                  ></textarea>
                  <div className="self-end flex gap-1 items-center">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setContent(post.content);
                      }}
                      className="bg-[#3a4046] rounded py-1 px-3 "
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-purple rounded py-1 px-3 "
                    >
                      Update
                    </button>
                  </div>
                </form>
              ) : (
                ""
              )}
              {post?.images.length !== 0 ? (
                <div
                  className={`grid gap-3 mt-1 ${
                    post.images.length === 1
                      ? "grid-cols-1"
                      : post.images.length === 2
                      ? "grid-cols-2"
                      : post.images.length === 3
                      ? "grid-cols-3"
                      : post.images.length === 4
                      ? "grid-cols-2 grid-rows-2"
                      : ""
                  }`}
                >
                  {post.images.map((image) => {
                    let width = 400;
                    let height = 400;
                    if (image.width) {
                      width = image.width;
                      height = image.height;
                      if (width < 200) {
                        width = image.width * 2;
                        height = image.height * 2;
                      }
                    }

                    return (
                      <div key={image.id}>
                        <Image
                          onClick={() => (
                            setSelectedUrl(image.imageUrl), setDialogOpen(true)
                          )}
                          src={image.imageUrl}
                          alt="Posted Image"
                          width={width}
                          height={height}
                          sizes="(max-width: 768px) 85vw, 65vw"
                          className="rounded cursor-pointer min-w-2/3 bg-#[343434] max-height-[500px]"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                ""
              )}
              {post?.reply ? (
                post.reply.replyToId !== null ? (
                  <Link href={`/post/${post.reply.replyToId}`}>
                    <div className="border mt-1 bg-[#202020] p-[6px] border-[#707070] rounded-md cursor-pointer">
                      <div className="flex items-center gap-1">
                        <Image
                          src={post.reply.replyToPost.postedBy.pfpURL}
                          alt="D"
                          width="16"
                          height="16"
                          className="rounded-full object-cover"
                        />
                        <h4 className="font-raleway font-semibold leading-none ">
                          {post.reply.replyToPost.postedBy.username}
                        </h4>
                      </div>
                      <p className="limit-lines break-words whitespace-pre-wrap">
                        {post.reply.replyToPost.content}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="border mt-1 bg-[#202020] p-[6px] border-[#707070] rounded-md">
                    <p>This post was deleted</p>
                  </div>
                )
              ) : (
                ""
              )}
              <span className="text-lightwht block py-[6px]">
                {post?.postedAt && post?.postedAt.length !== 0
                  ? format(new Date(post?.postedAt), "hh:mm a · MMM dd, yyyy")
                  : ""}
              </span>
              <div
                className={`flex py-1 items-center border-y border-y-[#808080] ${
                  post.images.length !== 0 || post.replyToId ? "mt-1" : ""
                }`}
              >
                {/* reply */}
                <div className="flex-1">
                  <div
                    onClick={() => {
                      setReplying(true);
                      setReplyingTo({
                        username: post.postedBy.username,
                        postId: post.id,
                      });
                    }}
                    className="cursor-pointer p-1 text-xl max-w-fit hover:bg-[#343434] rounded-full"
                  >
                    <ReplyIcon />
                  </div>
                </div>
                {/* repost */}
                <div className="flex-1">
                  <div
                    onClick={() => {
                      sendRepost(post.id, accessToken);
                    }}
                    className="cursor-pointer p-1 text-xl max-w-fit hover:bg-[#343434] rounded-full"
                  >
                    <RepostIcon />
                  </div>
                </div>
                {/* like */}
                <div className="flex-1">
                  <div
                    onClick={() => {
                      likeHandler();
                    }}
                    className="max-w-fit group/like flex items-center"
                  >
                    {liked ? (
                      <div className="cursor-pointer p-1 text-xl group-hover/like:bg-[#f918801a] rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="rgb(249, 24, 128)"
                            d="m12 21l-1.45-1.3q-2.525-2.275-4.175-3.925T3.75 12.812Q2.775 11.5 2.388 10.4T2 8.15Q2 5.8 3.575 4.225T7.5 2.65q1.3 0 2.475.55T12 4.75q.85-1 2.025-1.55t2.475-.55q2.35 0 3.925 1.575T22 8.15q0 1.15-.388 2.25t-1.362 2.412q-.975 1.313-2.625 2.963T13.45 19.7L12 21Z"
                          ></path>
                        </svg>
                      </div>
                    ) : (
                      <div className="cursor-pointer p-1 text-xl group-hover/like:bg-[#f918801a] rounded-full group-hover/like:text-[rgb(249,24,128)]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3C4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5C22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1l-.1-.1C7.14 14.24 4 11.39 4 8.5C4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5c0 2.89-3.14 5.74-7.9 10.05z"
                          ></path>
                        </svg>
                      </div>
                    )}
                    <span
                      className={`text-sm pt-[1px] group-hover/like:text-[rgb(249,24,128)] ${
                        liked ? "text-[rgb(249,24,128)]" : ""
                      }`}
                    >
                      {likeCount ?? post?.likes.length}
                    </span>
                  </div>
                </div>
                {/* share */}
                <div
                  onClick={() => {
                    copyLink();
                  }}
                  className="cursor-pointer p-1 max-w-fit text-xl hover:bg-[#343434] rounded-full"
                >
                  <LinkIcon />
                </div>
                {/*thats all*/}
              </div>
            </div>
          </ContextMenu.Trigger>
          <ImageDialog
            selectedUrl={selectedUrl}
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
          />
          <ContextMenu.Portal>
            <ContextMenu.Content
              collisionPadding={{ bottom: 60 }}
              className="bg-[#282828] rounded min-w-[10rem] p-1 flex flex-col gap-[2px]"
            >
              {post?.postedBy.username === cUser?.username ||
              cUser?.role === "ADMIN" ? (
                <ContextMenu.Group>
                  <ContextMenu.Item
                    onClick={() => deletePost.mutate()}
                    className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-[#ee4a4a]"
                  >
                    <TrashIcon />
                    <span>Delete</span>
                  </ContextMenu.Item>
                  {post?.postedBy.username === cUser?.username ? (
                    <ContextMenu.Item
                      onClick={() => setEditing(true)}
                      className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple"
                    >
                      <EditIcon />
                      <span>Edit</span>
                    </ContextMenu.Item>
                  ) : (
                    ""
                  )}
                  <ContextMenu.Separator className="h-[1px] w-[97%] ml-[3px] mt-1 rounded-lg bg-[#5d5d5d]" />
                </ContextMenu.Group>
              ) : (
                ""
              )}
              <ContextMenu.Item
                onClick={() => {
                  setReplying(true);
                  setReplyingTo({
                    username: post?.postedBy.username,
                    postId: post.id,
                  });
                }}
                className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple"
              >
                <ReplyIcon />
                <span>Reply</span>
              </ContextMenu.Item>
              <ContextMenu.Item className="rounded cursor-pointer hover:outline-0 hover:bg-purple">
                <Link
                  className="flex items-center gap-2 p-1 w-full h-full"
                  href={`/profile/${post?.postedBy?.username}`}
                >
                  <UserIcon />
                  <span>View Profile</span>
                </Link>
              </ContextMenu.Item>
              <ContextMenu.Item
                onClick={() => copyLink()}
                className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple"
              >
                <LinkIcon />
                <span>Copy Link</span>
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
        {post.replies.length > 0 ? (
          <div className="overflow-auto pt-1">
            <div className="flex flex-col gap-1">
              {post?.replies?.map((reply) => (
                <GlobalPost post={reply.replyPost} cUser={cUser} />
              ))}
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
      {replying ? <Input /> : ""}
    </div>
  );
}
