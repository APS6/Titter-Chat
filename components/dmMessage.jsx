import { useEffect, useRef, useState } from "react";
import Linkify from "react-linkify";
import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Popover from "@radix-ui/react-popover";
import TrashIcon from "./svg/trashIcon";
import EditIcon from "./svg/editIcon";
import UserIcon from "./svg/userIcon";
import LinkIcon from "./svg/linkIcon";
import ImageDialog from "./imageDialog";
import ThreeDots from "./svg/threeDots";
import { format } from "date-fns";
import { useAuthContext } from "@/context/authContext";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function DMMessage({ message, divRef, cUsername }) {
  const { user, accessToken } = useAuthContext();
  const [selectedUrl, setSelectedUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(message.content);

  const queryClient = useQueryClient();

  let received = message.sentToId === user.uid;
  const localPostedAt = new Date(message.sentAt);
  const formattedPostedAt = format(localPostedAt, "MMM, d, yyyy, hh:mm aa");
  const images = message.images;

  const textareaRef = useRef(null);

  const deleteMessage = useMutation({
    mutationFn: () => deleteMessageFn(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["dm", cUsername] });
      const previousData = queryClient.getQueryData(["dm", cUsername]);
      queryClient.setQueryData(["dm", cUsername], (old) => {
        let newData = [...old.pages];
        const pageIndex = newData.findIndex((pg) =>
          pg.items.some((p) => p.id === message.id)
        );
        if (pageIndex !== -1) {
          newData[pageIndex].items = newData[pageIndex].items.filter(
            (p) => p.id !== message.id
          );
        }
        return {
          pages: newData,
          pageParams: old.pageParams,
          deleted: message.id,
        };
      });
      return { previousData };
    },
    onError: (err, v, context) => {
      console.error(err);
      queryClient.setQueryData(["dm", cUsername], context.previousData);
    },
  });

  const editMessage = useMutation({
    mutationFn: () => editMessageFn(),
    onMutate: async () => {
      setEditing(false);
      await queryClient.cancelQueries({ queryKey: ["dm", cUsername] });
      const previousData = queryClient.getQueryData(["dm", cUsername]);

      queryClient.setQueryData(["dm", cUsername], (old) => {
        let newData = [...old.pages];
        const pageIndex = newData.findIndex((pg) =>
          pg.items.some((p) => p.id === message.id)
        );
        if (pageIndex !== -1) {
          const pIndex = newData[pageIndex].items.findIndex(
            (p) => p.id === message.id
          );
          if (pIndex !== -1) {
            const edMessage = {
              ...message,
              content: content,
              edited: true,
            };
            newData[pageIndex].items.splice(pIndex, 1, edMessage);
          }
        }
        return {
          pages: newData,
          pageParams: old.pageParams,
          deleted: message.id,
        };
      });
      return { previousData };
    },
    onError: (err, v, context) => {
      console.error(err);
      queryClient.setQueryData(["dm", cUsername], context.previousData);
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

  const componentDecorator = (href, text, key) => (
    <a href={href} key={key} target="_blank" className="underline">
      {text}
    </a>
  );

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        key={message.id}
        ref={divRef}
        className={` flex flex-col w-full gap-1 group ${
          received ? "self-start items-start" : "self-end items-end"
        }`}
      >
        <div
          className={`flex gap-2 max-w-[75%] ${
            received
              ? "flex-row justify-start"
              : " flex-row-reverse justify-end"
          }`}
        >
          <div className="flex flex-col gap-1 max-w-full">
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
          <Popover.Root>
            <Popover.Trigger
              className={`pc-opacity-0 self-center group-hover:opacity-100 ${
                editing ? "hidden" : ""
              }  hover:bg-[#343434] rounded-full p-1`}
            >
              <ThreeDots />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="bg-[#282828] rounded min-w-[10rem] p-1 flex flex-col gap-[2px]">
                {!received ? (
                  <div className="flex flex-col gap-[2px]">
                    <div
                      onClick={() => deleteMessage.mutate()}
                      className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-[#ee4a4a]"
                    >
                      <TrashIcon />
                      <span>Delete</span>
                    </div>
                    <div
                      onClick={() => setEditing(true)}
                      className="flex items-center p-1 rounded gap-2 cursor-pointer hover:outline-0 hover:bg-purple"
                    >
                      <EditIcon />
                      <span>Edit</span>
                    </div>
                    <div className="h-[1px] w-[97%] ml-[3px] mt-1 rounded-lg bg-[#5d5d5d]"></div>
                  </div>
                ) : (
                  ""
                )}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
        <span className="text-xs text-lightwht">{formattedPostedAt}</span>
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
            </ContextMenu.Group>
          ) : (
            ""
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
