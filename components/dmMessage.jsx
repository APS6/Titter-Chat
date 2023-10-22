import { useEffect, useRef, useState } from "react";
import Linkify from "react-linkify";
import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Popover from "@radix-ui/react-popover";
import TrashIcon from "./svg/trashIcon";
import EditIcon from "./svg/editIcon";
import ImageDialog from "./imageDialog";
import ThreeDots from "./svg/threeDots";
import { format } from "date-fns";
import { useAuthContext } from "@/context/authContext";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReplyIcon from "./svg/replyIcon";

export default function DMMessage({
  message,
  divRef,
  cUsername,
  setReplying,
  setReplyingTo,
}) {
  const { user, accessToken } = useAuthContext();
  const [selectedUrl, setSelectedUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(message.content);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const queryClient = useQueryClient();

  let received = message.sentToId === user.uid;
  const localPostedAt = new Date(message.sentAt);
  const formattedPostedAt = format(localPostedAt, "MMM, d, yy, hh:mm aa");
  const images = message.images;

  const textareaRef = useRef(null);

  const deleteMessage = useMutation({
    mutationFn: () => deleteMessageFn(),
    onMutate: async () => {
      setPopoverOpen(false);
      await queryClient.cancelQueries({ queryKey: ["dm", cUsername] });
      const previousData = queryClient.getQueryData(["dm", cUsername]);
      queryClient.setQueryData(["dm", cUsername], (old) => {
        const newData = old.pages.map((pg) => {
          return {
            ...pg,
            items: pg.items.reduce((acc, p) => {
              if (p.id === message.id) {
                return acc;
              } else if (p.reply?.replyToId === message.id) {
                acc.push({ ...p, reply: { replyToId: null } });
              } else {
                acc.push(p);
              }
              return acc;
            }, []),
          };
        });
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
      queryClient.setQueryData(["dm", cUsername], context.previousData);
    },
    onSuccess: () => {
      toast("Deleted post successfully", {
        icon: <TrashIcon />,
        duration: 2000,
      });
    },
  });

  const editMessage = useMutation({
    mutationFn: () => editMessageFn(),
    onMutate: async () => {
      setPopoverOpen(false);
      setEditing(false);
      await queryClient.cancelQueries({ queryKey: ["dm", cUsername] });
      const previousData = queryClient.getQueryData(["dm", cUsername]);

      queryClient.setQueryData(["dm", cUsername], (old) => {
        const newData = old.pages.map((pg) => {
          return {
            ...pg,
            items: pg.items.reduce((acc, p) => {
              if (p.id === message.id) {
                acc.push({ ...p, content: content, edited: true });
              } else if (p.reply?.replyToId === message.id) {
                acc.push({
                  ...p,
                  reply: {
                    ...p.reply,
                    replyToMessage: {
                      ...p.reply.replyToMessage,
                      content: content,
                      edited: true,
                    },
                  },
                });
              } else {
                acc.push(p);
              }
              return acc;
            }, []),
          };
        });
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
      queryClient.setQueryData(["dm", cUsername], context.previousData);
    },
    onSuccess: () => {
      toast("Edited post successfully", {
        icon: <EditIcon />,
        duration: 2000,
      });
    },
  });

  const deleteMessageFn = async () => {
    const body = {
      messageId: message.id,
    };
    const response = await fetch("/api/DM", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken,
      },
      body: JSON.stringify(body),
    });
    return response;
  };

  const editMessageFn = async () => {
    const body = {
      messageId: message.id,
      content: content,
    };
    const response = await fetch("/api/DM", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken,
      },
      body: JSON.stringify(body),
    });
    return response;
  };

  const editHandler = (e) => {
    setContent(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    editMessage.mutate();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && editing) {
      e.preventDefault();
      editMessage.mutate();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content, editing]);

  useEffect(() => {
    setContent(message.content);
  }, [message.content]);

  const componentDecorator = (href, text, key) => (
    <a href={href} key={key} target="_blank" className="underline">
      {text}
    </a>
  );

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        ref={divRef}
        className={` flex flex-col w-full gap-1 group ${
          received ? "self-start items-start" : "self-end items-end"
        }`}
      >
        <div
          className={`flex gap-2 max-w-[75%] justify-start ${
            received ? "flex-row " : " flex-row-reverse"
          }`}
        >
          <div
            className={`flex flex-col gap-1 max-w-[90%] ${
              received ? "items-start" : " items-end"
            }`}
          >
            {message.reply ? (
              <div className="bg-grey rounded-3xl px-4 pt-4 pb-6 max-w-full -mb-5 flex gap-2">
                <p className="break-words whitespace-pre-wrap text-lightwht limit-lines">
                  {message.reply.replyToId
                    ? message.reply.replyToMessage.content
                    : "This message was deleted"}
                </p>
                {message.reply.replyToId &&
                message.reply.replyToMessage?.images?.length !== 0 ? (
                  <Image
                    className=" self-end"
                    src={message.reply.replyToMessage.images[0].imageUrl}
                    alt="Image"
                    width={20}
                    height={20}
                  />
                ) : (
                  ""
                )}
              </div>
            ) : (
              ""
            )}
            {message.content.length !== 0 ? (
              <div
                className={`bg-grey relative rounded-3xl px-4 py-4 max-w-full ${
                  received ? "rounded-bl-[4px]" : " bg-purple rounded-br-[4px]"
                }`}
              >
                {!editing ? (
                  <p className="break-words whitespace-pre-wrap">
                    <Linkify componentDecorator={componentDecorator}>
                      {message.content}
                      {message.edited ? (
                        <span className=" text-lightwht text-sm ml-[2px]">
                          (edited)
                        </span>
                      ) : (
                        ""
                      )}
                    </Linkify>
                  </p>
                ) : (
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
                        onClick={() => setEditing(false)}
                        className="bg-grey rounded py-1 px-3"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-grey rounded py-1 px-3"
                      >
                        Update
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              ""
            )}
            {images
              ? images.map((image) => {
                  return (
                    <div key={image.id} className="rounded bg-grey">
                      <Image
                        onClick={() => (
                          setSelectedUrl(image.imageUrl), setDialogOpen(true)
                        )}
                        className="object-contain rounded max-w-300px cursor-pointer"
                        src={image.imageUrl}
                        alt="Image"
                        width={300}
                        height={300}
                        sizes="(max-width: 768px) 75vw,(max-width: 1000px) 48vw, 300px"
                      />
                    </div>
                  );
                })
              : ""}
          </div>
          {!received ? (
            <Popover.Root
              open={popoverOpen}
              onOpenChange={(open) => setPopoverOpen(open)}
            >
              <Popover.Trigger
                className={`pc-opacity-0 self-center group-hover:opacity-100 ${
                  editing ? "hidden" : ""
                }  hover:bg-[#343434] rounded-full p-1`}
              >
                <ThreeDots />
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  collisionPadding={{ bottom: 70 }}
                  className="bg-[#282828] rounded min-w-[10rem] p-1 flex flex-col gap-[2px]"
                >
                  <div className="flex flex-col gap-[2px]">
                    <button
                      onClick={() => deleteMessage.mutate()}
                      className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-[#ee4a4a]"
                    >
                      <TrashIcon />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple"
                    >
                      <EditIcon />
                      <span>Edit</span>
                    </button>
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          ) : (
            ""
          )}
          <div
            onClick={() => {
              setReplying(true);
              setReplyingTo({
                messageId: message.id,
                content: message.content,
              });
            }}
            className="p-1 rounded-full cursor-pointer pc-opacity-0 self-center group-hover:opacity-100 hover:bg-[#343434]"
          >
            <ReplyIcon />
          </div>
        </div>
        <span className="text-xs text-lightwht leading-none">
          {formattedPostedAt}
        </span>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          collisionPadding={{ bottom: 70 }}
          className="bg-[#282828] rounded min-w-[10rem] p-1 flex flex-col gap-[2px]"
        >
          {!received ? (
            <ContextMenu.Group>
              <ContextMenu.Item
                onClick={() => deleteMessage.mutate()}
                className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-[#ee4a4a]"
              >
                <TrashIcon />
                <span>Delete</span>
              </ContextMenu.Item>

              <ContextMenu.Item
                onClick={() => setEditing(true)}
                className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple"
              >
                <EditIcon />
                <span>Edit</span>
              </ContextMenu.Item>
              <ContextMenu.Item
                onClick={() => {
                  setReplying(true);
                  setReplyingTo({
                    messageId: message.id,
                    content: message.content,
                  });
                }}
                className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple"
              >
                <ReplyIcon />
                <span>Reply</span>
              </ContextMenu.Item>
            </ContextMenu.Group>
          ) : (
            <ContextMenu.Item
              onClick={() => {
                setReplying(true);
                setReplyingTo({
                  messageId: message.id,
                  content: message.content,
                });
              }}
              className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple"
            >
              <ReplyIcon />
              <span>Reply</span>
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
      <ImageDialog
        selectedUrl={selectedUrl}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
      />
    </ContextMenu.Root>
  );
}
