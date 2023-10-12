'use client'
import { useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/context/authContext";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { ably } from "@/app/lib/webSocket";
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
import { useParams, useRouter } from "next/navigation";
import fetchData from "@/app/lib/fetchData";
import BlockLoader from "@/components/svg/blockLoader";

export default function Post() {
  const { user, accessToken } = useAuthContext();
  const {postId} = useParams()
  const channel = ably.channels.get("likes");

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState();

  const [selectedUrl, setSelectedUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState();
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState();
  const [content, setContent] = useState();
  const [popoverOpen, setPopoverOpen] = useState(false)

  const textareaRef = useRef(null);
  const router = useRouter()

  const queryClient = useQueryClient();

  const {data: post, isError, error, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchData(`Posts/${postId}`),
    enabled: !!postId && postId.length !== 0
  })

  const { data: cUser } = useQuery({
    queryKey: [user?.uid, "userOverview"],
    queryFn: () => fetchData(`UserOverview/${user.uid}`),
    staleTime: 1000 * 60 * 5,
    enabled: !!user?.uid,
  });


  const deletePost = useMutation({
    mutationFn: () => deletePostFn(),
    onMutate: async () => {
      setPopoverOpen(false)
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousData = queryClient.getQueryData(["posts"]);
      queryClient.setQueryData(["posts"], (old) => {
        let newData = [...old.pages];
        const pageIndex = newData.findIndex((pg) =>
          pg.items.some((p) => p.id === post.id)
        );
        if (pageIndex !== -1) {
          newData[pageIndex].items = newData[pageIndex].items.filter(
            (p) => p.id !== post.id
          );
        }
        return {
          pages: newData,
          pageParams: old.pageParams,
          c: old.c ? old.c + 1 : 1,
        };
      });
      return { previousData };
    },
    onError: (err, v, context) => {
      console.error(err);
      queryClient.setQueryData(["posts"], context.previousData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["post", post.id])
      router.push("/Home")
    }
  });

  const editPost = useMutation({
    mutationFn: () => editPostFn(),
    onError: (err, v, context) => {
      console.error(err);
      queryClient.setQueryData(["post", post.id], context.previousData);
    },
    onMutate: async () => {
      setEditing(false);
      setPopoverOpen(false)
      setEdited(true);
      await queryClient.cancelQueries({ queryKey: ["post", post.id] });
      const previousData = queryClient.getQueryData(["post", post.id]);
      queryClient.setQueryData(["post", post.id], (old) => {
        return {
         ...old,
         content: content
        };
      });
      return { previousData };
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
    return response;
  };

  const likeHandler = async (action) => {
    if (action === "like") {
      setLiked(true);
      setLikeCount(post.likes + 1);
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
    } else if (action === "dislike") {
      setLiked(false);
      setLikeCount(post.likes - 1);
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
        console.log("copied post url")
        setPopoverOpen(false)
      },
      (err) => {
        console.error("Error copying URL :", err)
      },
    );
  }

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
    };
  }, []);

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setLiked(post.likes.some((like) => like.userId === user.uid))
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
    <ContextMenu.Root>
      <div className="h-[100svh] px-1 grid place-items-center">
      <ContextMenu.Trigger className="w-full">
        <div
          className="bg-grey flex items-start mt-16 md:mt-2 gap-2 p-2 pb-1 rounded group relative"
        >
          <Link href={`/profile/${post?.postedBy?.username}`}>
            {post?.postedBy.pfpURL ? (
              <Image
                src={post?.postedBy?.pfpURL}
                alt="D"
                width="30"
                height="30"
                className="rounded-full w-[30px] h-[30px] object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30px"
                height="30px"
                viewBox="0 0 16 16"
              >
                <path
                  fill="currentColor"
                  d="M16 7.992C16 3.58 12.416 0 8 0S0 3.58 0 7.992c0 2.43 1.104 4.62 2.832 6.09c.016.016.032.016.032.032c.144.112.288.224.448.336c.08.048.144.111.224.175A7.98 7.98 0 0 0 8.016 16a7.98 7.98 0 0 0 4.48-1.375c.08-.048.144-.111.224-.16c.144-.111.304-.223.448-.335c.016-.016.032-.016.032-.032c1.696-1.487 2.8-3.676 2.8-6.106zm-8 7.001c-1.504 0-2.88-.48-4.016-1.279c.016-.128.048-.255.08-.383a4.17 4.17 0 0 1 .416-.991c.176-.304.384-.576.64-.816c.24-.24.528-.463.816-.639c.304-.176.624-.304.976-.4A4.15 4.15 0 0 1 8 10.342a4.185 4.185 0 0 1 2.928 1.166c.368.368.656.8.864 1.295c.112.288.192.592.24.911A7.03 7.03 0 0 1 8 14.993zm-2.448-7.4a2.49 2.49 0 0 1-.208-1.024c0-.351.064-.703.208-1.023c.144-.32.336-.607.576-.847c.24-.24.528-.431.848-.575c.32-.144.672-.208 1.024-.208c.368 0 .704.064 1.024.208c.32.144.608.336.848.575c.24.24.432.528.576.847c.144.32.208.672.208 1.023c0 .368-.064.704-.208 1.023a2.84 2.84 0 0 1-.576.848a2.84 2.84 0 0 1-.848.575a2.715 2.715 0 0 1-2.064 0a2.84 2.84 0 0 1-.848-.575a2.526 2.526 0 0 1-.56-.848zm7.424 5.306c0-.032-.016-.048-.016-.08a5.22 5.22 0 0 0-.688-1.406a4.883 4.883 0 0 0-1.088-1.135a5.207 5.207 0 0 0-1.04-.608a2.82 2.82 0 0 0 .464-.383a4.2 4.2 0 0 0 .624-.784a3.624 3.624 0 0 0 .528-1.934a3.71 3.71 0 0 0-.288-1.47a3.799 3.799 0 0 0-.816-1.199a3.845 3.845 0 0 0-1.2-.8a3.72 3.72 0 0 0-1.472-.287a3.72 3.72 0 0 0-1.472.288a3.631 3.631 0 0 0-1.2.815a3.84 3.84 0 0 0-.8 1.199a3.71 3.71 0 0 0-.288 1.47c0 .352.048.688.144 1.007c.096.336.224.64.4.927c.16.288.384.544.624.784c.144.144.304.271.48.383a5.12 5.12 0 0 0-1.04.624c-.416.32-.784.703-1.088 1.119a4.999 4.999 0 0 0-.688 1.406c-.016.032-.016.064-.016.08C1.776 11.636.992 9.91.992 7.992C.992 4.14 4.144.991 8 .991s7.008 3.149 7.008 7.001a6.96 6.96 0 0 1-2.032 4.907z"
                ></path>
              </svg>
            )}
          </Link>
          <div className="w-[92%]">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${post?.postedBy?.username}`}>
                <h3 className="text-lg font-raleway font-semibold leading-none hover:underline">
                  {post?.postedBy?.username ?? "DELETED"}
                </h3>
              </Link>
              <span className="text-sm text-lightwht leading-none">{post?.postedAt && post?.postedAt.length !== 0 ? format(new Date(post?.postedAt), "dd/MM/yy hh:mm a") : ""}</span>
            </div>
            {post?.content?.length !== 0 && !editing ? (
              <p className="mb-1 break-words whitespace-pre-wrap">
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <textarea
                  ref={textareaRef}
                  className="outline-0 bg-[transparent] max-h-[500px] resize-none"
                  placeholder="type your tit"
                  rows="1"
                  onChange={(e) => editHandler(e)}
                  onKeyDown={(e) => handleKeyDown(e)}
                  value={content}
                ></textarea>
                <div className="self-end flex gap-1 items-center">
                  <button
                    onClick={() => {setEditing(false); setContent(post?.content)}}
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
                className={`grid gap-3 ${
                  post?.images.length === 1
                    ? "grid-cols-1"
                    : post?.images.length === 2
                    ? "grid-cols-2"
                    : post?.images.length === 3
                    ? "grid-cols-3"
                    : post?.images.length === 4
                    ? "grid-cols-2 grid-rows-2"
                    : ""
                }`}
              >
                {post?.images.map((image) => {
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
                        className="rounded w-auto h-full cursor-pointer min-w-2/3 bg-#[343434] max-height-[500px]"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              ""
            )}
            <div className={`flex ${post?.images ? "mt-1" : ""}`}>
              <div className="flex items-center">
                {liked ? (
                  <div
                    className="cursor-pointer p-1 hover:bg-[#343434] rounded-full"
                    onClick={() => likeHandler("dislike")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16px"
                      height="16px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="rgb(249, 24, 128)"
                        d="m12 21l-1.45-1.3q-2.525-2.275-4.175-3.925T3.75 12.812Q2.775 11.5 2.388 10.4T2 8.15Q2 5.8 3.575 4.225T7.5 2.65q1.3 0 2.475.55T12 4.75q.85-1 2.025-1.55t2.475-.55q2.35 0 3.925 1.575T22 8.15q0 1.15-.388 2.25t-1.362 2.412q-.975 1.313-2.625 2.963T13.45 19.7L12 21Z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer p-1 hover:bg-[#343434] rounded-full hover:text-[rgb(249,24,128)]"
                    onClick={() => likeHandler("like")}
                  >
                    <svg
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
                  </div>
                )}
                <span
                  className={`text-sm pt-[1px] ${
                    liked ? "text-[rgb(249,24,128)]" : ""
                  }`}
                >
                  {likeCount ?? post?.likes.length}
                </span>
              </div>
            </div>
          </div>
          <Popover.Root onClick={() => copyLink()} open={popoverOpen} onOpenChange={(open) => setPopoverOpen(open)}>
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
                        onClick={() => setEditing(true)}
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
                <div className="rounded cursor-pointer hover:outline-0 hover:bg-purple">
                  <Link
                    className="flex items-center gap-2 p-1 w-full h-full"
                    href={`/profile/${post?.postedBy?.username}`}
                  >
                    <UserIcon />
                    <span>View Profile</span>
                  </Link>
                </div>
                <div className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple">
                  <LinkIcon />
                  <span>Copy Link</span>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </ContextMenu.Trigger>
      </div>
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
          {post?.postedBy.username === cUser?.username || cUser?.role === "ADMIN" ? (
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
          <ContextMenu.Item className="rounded cursor-pointer hover:outline-0 hover:bg-purple">
            <Link
              className="flex items-center gap-2 p-1 w-full h-full"
              href={`/profile/${post?.postedBy?.username}`}
            >
              <UserIcon />
              <span>View Profile</span>
            </Link>
          </ContextMenu.Item>
          <ContextMenu.Item  onClick={() => copyLink()} className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple">
            <LinkIcon />
            <span>Copy Link</span>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
