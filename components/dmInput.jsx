"use client";
import { useAuthContext } from "@/context/authContext";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { UploadDropzone } from "@uploadthing/react";
import Image from "next/image";

export default function DMInput({ sendingTo, cUsername, username, disabled, setShrink }) {
  const { user, accessToken, } = useAuthContext();
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [images, setImages] = useState([]);

  const messageHandler = (e) => {
    setMessage(e.target.value);
  };

  const sendMessage = async () => {
    if (message || images.length !== 0) {
      const body = {
        content: message,
        sentById: user.uid,
        sentToId: sendingTo,
        sentToUsername: cUsername,
        sentByUsername: username,
        images: images,
      };
      setLoading(true);
      setShowLoading(true);
      try {
        const response = await fetch("/api/DM", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken,
          },
          body: JSON.stringify(body),
        });
        if (response.status !== 200) {
          console.log("something went wrong");
          setLoading(false);
          const timer = setTimeout(() => {
            setShowLoading(false);
          }, 500);
        } else {
          setMessage("");
          setImages([]);
          setShrink(false);
          setLoading(false);
          const timer = setTimeout(() => {
            setShowLoading(false);
          }, 500);
        }
      } catch (error) {
        console.log("there was an error submitting", error);
      }
    }
  };

  const deleteFiles = async (image) => {
    if (image) {
      const filteredImages = images.filter(
        (img) => img.imageUrl !== image.imageUrl
      );
      setImages(filteredImages);
      if (filteredImages.length === 0) {
        setShrink(false)
      }
      const body = {
        key: image.key,
      };
      try {
        const response = await fetch("/api/uploadthing", {
          method: "DELETE",
          body: JSON.stringify(body),
        });
      } catch (error) {
        console.error("there was an error submitting", error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-grey rounded">
    {images.length > 0 ? (
      <div className="flex mt-1 gap-3 pt-2 px-2 items-center sm:overflow-auto">
        {images.map((image) => {
          return (
            <div className="relative bg-[#343434] rounded" key={image.key}>
              <Image
                src={image.imageUrl}
                alt="uploaded image"
                width="100"
                height="100"
                className=" object-cover rounded w-16 h-16 sm:w-24 sm:h-24"
              />
              <div
                onClick={() => deleteFiles(image)}
                className="absolute top-0 right-0 translate-x-[30%] -translate-y-[30%] cursor-pointer bg-[#000000] text-lightwht hover:text-[#d86262] rounded-full p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7 21q-.825 0-1.413-.588T5 19V6q-.425 0-.713-.288T4 5q0-.425.288-.713T5 4h4q0-.425.288-.713T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5q0 .425-.288.713T19 6v13q0 .825-.588 1.413T17 21H7ZM17 6H7v13h10V6ZM9 17h2V8H9v9Zm4 0h2V8h-2v9ZM7 6v13V6Z"></path>
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      ""
    )}
    <div
      className={`bg-grey py-1 rounded outline-none flex items-center gap-2 px-2 ${
        typing ? "outline-1 outline-lightwht outline-offset-0" : ""
      }`}
    >
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Trigger
          disabled={images.length === 4}
          className={`hover:bg-[#343434] rounded-full p-1 ${images.length === 4 ? "text-[#a5a5a5] cursor-not-allowed" : ""}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M5 21q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h8q.425 0 .713.288T14 4q0 .425-.288.713T13 5H5v14h14v-8q0-.425.288-.713T20 10q.425 0 .713.288T21 11v8q0 .825-.588 1.413T19 21H5ZM17 7h-1q-.425 0-.713-.288T15 6q0-.425.288-.713T16 5h1V4q0-.425.288-.713T18 3q.425 0 .713.288T19 4v1h1q.425 0 .713.288T21 6q0 .425-.288.713T20 7h-1v1q0 .425-.288.713T18 9q-.425 0-.713-.288T17 8V7Zm-5.75 9L9.4 13.525q-.15-.2-.4-.2t-.4.2l-2 2.675q-.2.25-.05.525T7 17h10q.3 0 .45-.275t-.05-.525l-2.75-3.675q-.15-.2-.4-.2t-.4.2L11.25 16Zm.75-4Z"
            ></path>
          </svg>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#000000] opacity-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-grey rounded flex flex-col p-4">
            <div className="flex justify-between w-full pb-2 border-b-lightwht border-b">
              <Dialog.Title className="text-xl">Upload Images</Dialog.Title>
              <Dialog.Close className="text-lightwht hover:text-[#878787] ">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1.5rem"
                  height="1.5rem"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fill="currentColor"
                    d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275L12 13.4Z"
                  ></path>
                </svg>
              </Dialog.Close>
            </div>
            <div className="grid place-items-center p-4">
              <UploadDropzone
                appearance={{
                  button:
                    "bg-[#2563eb] ut-uploading:cursor-not-allowed w-36 after:transition-[width] after:duration-500",
                  container: "p-4 border-dashed border-[#aeb8c8]",
                  allowedContent: "leading-5 h-[1.25rem] text-[#b3b9c3]",
                  label:
                    "leading-6 w-44 sm:w-64 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#2563eb] focus-within:ring-offset-2 hover:text-[#4392ff] text-[#2563eb]",
                  uploadIcon: "text-[#aeb8c8]",
                }}
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  const newImages = res.map((img) => {
                    return { imageUrl: img.url, key: img.key };
                  });

                  const updatedImages = [...images, ...newImages];

                  if (updatedImages.length > 4) {
                    alert("Stop messing around");
                    updatedImages.splice(updatedImages.length - 4);
                  }
                  setImages(updatedImages);
                  setShrink(true);
                  setDialogOpen(false);
                }}
                onUploadError={(error) => {
                  alert(`ERROR! ${error.message}`);
                }}

              />
            </div>
            <div className=" h-5 w-5 animate-spin align-middle text-white hidden"></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <input
       disabled={disabled}
       onFocus={() => setTyping(true)}
       onBlur={() => setTyping(false)}
       onChange={(e) => messageHandler(e)}
       value={message}
       onKeyDown={(e) => e.key === "Enter" && sendMessage()}
       type="text"
       placeholder={disabled ? 'You can message this user' : "Send a private tit"}
        className="rounded w-full bg-grey outline-none"
      />
      <div
        onClick={() => sendMessage()}
        className={`cursor-pointer hover:bg-[#343434] rounded-full p-1 ${
          message.length === 0 && images.length === 0
            ? "text-[#a5a5a5] cursor-not-allowed"
            : "text-lightwht"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="currentColor"
        >
          <path d="M5.13333 22.6625C4.74444 22.8181 4.375 22.7838 4.025 22.5598C3.675 22.3358 3.5 22.0103 3.5 21.5833V16.3333L12.8333 14L3.5 11.6667V6.41668C3.5 5.9889 3.675 5.66301 4.025 5.43901C4.375 5.21501 4.74444 5.18118 5.13333 5.33751L23.1 12.9208C23.5861 13.1347 23.8292 13.4945 23.8292 14C23.8292 14.5056 23.5861 14.8653 23.1 15.0792L5.13333 22.6625Z" />
        </svg>
      </div>
    </div>
    <div
      className={`fixed w-full top-0 left-0 right-0 h-1 ${
        showLoading ? "block" : "hidden"
      } ${loading ? "animate-loading" : "animate-loaded"}`}
    ></div>
  </div>
  );
}
