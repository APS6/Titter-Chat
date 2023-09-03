import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuthContext } from "@/context/authContext";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Ably from "ably";
import * as Dialog from "@radix-ui/react-dialog";

const client = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = client.channels.get("likes");

export default function GlobalPost({ post, sender, images, }) {
  const { user, accessToken } = useAuthContext();
  const [liked, setLiked] = useState(
    post.likes ? post.likes.some((like) => like.userId === user.uid) : false
  );
  const [likeCount, setLikeCount] = useState(post?.likes?.length ?? 0);

  const areaRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState(10);
  const [selectedUrl, setSelectedUrl] = useState("")
  useLayoutEffect(() => {
    const updateImageDimensions = () => {
      if (areaRef.current) {
        let newWidth = 1;
        if (images.length === 1) {
          newWidth = areaRef.current.offsetWidth;
        } else if (images.length === 2 || images.length === 4) {
          newWidth = areaRef.current.offsetWidth / 2;
        } else if (images.length === 3) {
          newWidth = areaRef.current.offsetWidth / 3;
        }
        setImageDimensions(newWidth);
      }
    };
    if (images.length !== 0) {
      updateImageDimensions();
    }
    return () => {
      window.removeEventListener("resize", updateImageDimensions);
    };
  }, []);

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
    } else if (action === "dislike") {
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

  return (
    <div className="bg-grey flex items-start gap-2 p-2 rounded" key={post.id}>
      <Link href={`/profile/${sender?.username}`}>
        {sender.pfpURL ? (
          <Image
            src={sender?.pfpURL}
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
      <div ref={areaRef} className="w-[92%]">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${sender?.username}`}>
            <h3 className="text-lg font-raleway font-semibold leading-none">
              {sender?.username ?? "DELETED"}
            </h3>
          </Link>
          <span className="text-sm text-lightwht">{formattedPostedAt}</span>
        </div>
        <p className="mb-1 break-words">
          {post?.content ?? "Could not find post"}
        </p>
        {images ? (
          <div
            className={`grid gap-3 ${
              images.length === 1
                ? "grid-cols-1"
                : images.length === 2
                ? "grid-cols-2"
                : images.length === 3
                ? "grid-cols-3"
                : images.length === 4
                ? "grid-cols-2 grid-rows-2"
                : ""
            }`}
          >
            <Dialog.Root>
              {images.map((image) => {
                return (
                  <Dialog.Trigger
                    onClick={() =>
                      setSelectedUrl(image.imageUrl)
                    }
                    key={image.id}
                  >
                    <Image

                      src={image.imageUrl}
                      alt="Posted Image"
                      width={imageDimensions}
                      height={imageDimensions}
                      placeholder="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/4QBCRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAkAAAAMAAAABAE8AAEABAAEAAAABAAAAAAAAAAAAAP/bAEMACwkJBwkJBwkJCQkLCQkJCQkJCwkLCwwLCwsMDRAMEQ4NDgwSGRIlGh0lHRkfHCkpFiU3NTYaKjI+LSkwGTshE//bAEMBBwgICwkLFQsLFSwdGR0sLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLP/AABEIATwB2gMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AM8k5pMmg9aKsgMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmjJoooAMmnZNNp1ADT1ooPWigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKdTadQA09aKD1ooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACnU2nUANPWig9aKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAp1Np1ADT1ooPWigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKdTadQA09aKD1ooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACnU2nUANPWig9aKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAp1Np1ADT1ooPWigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKdHG8rpGgyzsFUUANorR/si6/wCesP8A4/8A4Uf2Rdf89Yf/AB//AApiM6itH+yLr/nrD/4//hR/ZF1/z1h/8f8A8KAM6itH+yLr/nrD/wCP/wCFH9kXX/PWH/x//CgDOorR/si6/wCesP8A4/8A4Uf2Rdf89Yf/AB//AAoAzqK0f7Iuv+esP/j/APhR/ZF1/wA9Yf8Ax/8AwoAzqK0f7Iuv+esP/j/+FVLm2ltXCSbTuG5SucEfjSAhooooGFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABTqbTqAGnrRQetFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVYsP+Py0/wCun9DVerFh/wAflp/10/oaBGtqF1NbCExbfnLA7hnpVD+1b3/pl/3zVjWPuW3+8/8AIVkUAX/7Vvf+mX/fNH9q3v8A0y/75qhRQBf/ALVvf+mX/fNH9q3v/TL/AL5qhRQBf/tW9/6Zf980f2re/wDTL/vmqFSQRmaaKIfxuF/DqaANGG81a4/1UaEd2K4UfiadNcazANzxR7e7Iu4D64q3c3EVjCgVAedkaDgcckk1HZXwui8boFdQW4OVZenegCCzv7m4uEjfZtIYnauDwM0zWP8AWWv/AFzf/wBCFOjgWDVAqDCMjOo9AR0pusf6y1/65v8A+hCgDLooooGFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABTqbTqAGnrRQetFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVYsP8Aj8tP+un9DVerFh/x+Wn/AF0/oaBF/WPuW3+8/wDIVkVr6x9y2/3n/kKyKACpYIJbiQRxjnqxPRR6mnW1rLdPtThR99z0UVtH7Jp0HTA6dt8rUAZN1YTWoD5Dx8AsoxtPuKqVv2l7FeB43UK5Byh5DqfT+tZ19YtbkyR5MDH6lD6H2oAo0+GTypYpP7jq34A80kcbyukaDLMcAf1NbLaVbmEIpImAH7wkkE+6+lAE88MF/AhV+M743Azg9CCKbaWUdn5kjOGYjBY/KqqOax917ZSNGGeNgc4ByrD1APGKbLd3cw2ySsV4yowFOPYUAX4p1uNUDryioyIfUKOtJrH+stf+ub/+hCq+mf8AH5H/ALr/AMqsax/rLX/rm/8A6EKAMuiiigYUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFOptOoAaetFB60UAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABViw/4/LT/rp/Q1XqxYf8flp/10/oaBF/WPuW3+8/8AIVRtLOS6b+7Ep+d8fovvWzd2n2prcM2I0LM+PvEHHAptxc29jGsaKN+393GvAHu2KAFlltdPhCqoHHyRj7zn1J/rWFPPLcSGSQ5PYD7qj0ApJZZZnMkjFmPc9vYCmUAKrMjKykhlIII6git2zvI7tDFKF83bh1P3ZF7kD+dYNKrMjKykhlIII6gigDobezt7RppAfvZwWx8idcZrPfVZBcl0GYB8mzpuH97PrUM+o3M8PksFAON7LkF8etU6AOieO01CBWB46q4xvQ+hFYVxbzWzlJB/usPuuPUUtvcy2z74+/DKfusPetxWtNRgweRwWXOHjagDJ0z/AI/I/wDdf+VWNY/1lr/1zf8A9CFFtaS2t/GG5QiTY46MMd/ejWP9Za/9c3/9CFAGXRRRQMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACnU2nUANPWig9aKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqxYf8flp/10/oar1PZMqXdqzEBRIMk9BkEUCNq+uzaxgquZJMhCfuqR3Nc+7vIzO7FmY5JPU10s1vb3G0SjcFzt+bHX6VD/AGdp/wDzz/8AHzQBz9FdB/Z2n/8APP8A8fNH9naf/wA8/wDx80wOforoP7O0/wD55/8Aj5o/s7T/APnn/wCPmgDn6K6D+ztP/wCef/j5o/s7T/8Ann/4+aAOfqSGaWBxJE2GH4gj0Irc/s7T/wDnn/4+aP7O0/8A55/+PmgB9rdw3S5X5ZFA3oeoPqPaqGsf6y1/65v/AOhCr8VnZwuJI02uMgHcT1471nauyGWBQwLJG24Dtk5GaQGbRRRQMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACnU2nUANPWig9aKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAp1Np1ADT1ooPWigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKdTadQA09aKD1ooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACnU2nUANPWig9aKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAp1Np1ADT1ooPWigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKdTadQA09aKD1ooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACnU2nUANPWig9aKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAp1Np1ADT1opzAZP1pMCgBKKXAowKAEopcCjAoASilwKMCgBKKXAowKAEopcCjAoASilwKMCgBKKXAowKAEopcCjAoASilwKMCgBKKXAowKAEopcCjAoASilwKMCgBKKXAowKAEopcCjAoASilwKMCgBKKXAowKAEopcCjAoASilwKMCgBKKXAowKAEopcCjAoASilwKMCgBKKXAowKAEopcCjAoASilwKMCgBKKXAowKAEopcCjAoASilwKMCgBKKXAowKAEp1JgVMEXA47e9AH/2Q=="
                      className="rounded w-auto h-full"
                    />
                  </Dialog.Trigger>
                );
              })}
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-[#000000] opacity-90" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Image
                    className="object-contain"
                    src={selectedUrl}
                    alt="Image"
                    width="1000"
                    height="1000"
                    sizes="95vw"
                  />
                  <a className="text-md text-[#4270d1] mt-1" href={selectedUrl} target="blank">Open in Browser</a>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        ) : (
          ""
        )}
        <div className={`flex ${images ? "mt-1" : ""}`}>
          <div className="flex gap-1 items-center">
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
                    fill="currentColor"
                    d="m12 21l-1.45-1.3q-2.525-2.275-4.175-3.925T3.75 12.812Q2.775 11.5 2.388 10.4T2 8.15Q2 5.8 3.575 4.225T7.5 2.65q1.3 0 2.475.55T12 4.75q.85-1 2.025-1.55t2.475-.55q2.35 0 3.925 1.575T22 8.15q0 1.15-.388 2.25t-1.362 2.412q-.975 1.313-2.625 2.963T13.45 19.7L12 21Z"
                  ></path>
                </svg>
              </div>
            ) : (
              <div
                className="cursor-pointer  p-1 hover:bg-[#343434] rounded-full"
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
            <span>{likeCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
