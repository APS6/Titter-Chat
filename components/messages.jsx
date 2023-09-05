"use client";
import { useEffect, useRef, useState } from "react";
import fetchData from "@/app/lib/fetchData";
import { useAuthContext } from "@/context/authContext";
import { useRouter } from "next/navigation";
import GlobalPost from "./globalPost";
import Ably from "ably";
import * as Dialog from "@radix-ui/react-dialog";

const ably = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = ably.channels.get("global");

export default function Messages() {
  const { user, shrink } = useAuthContext();
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);

  const messagesRef = useRef(null);
  const bottomRef = useRef(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [isInitial, setIsInitial] = useState(true);


  
  if (!user) {
    router.push("/SignIn");
  }
  const sortPosts = (posts) => {
    return [...posts].sort(
      (a, b) => new Date(a.postedAt) - new Date(b.postedAt)
    );
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsData = await fetchData("Posts");
        setPosts(sortPosts(postsData));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    const fetchUsers = async () => {
      try {
        const usersData = await fetchData("User");
        setUsers(usersData);
        const exist = usersData.find((u) => u.id === user.uid);
        if (!exist) {
          router.push("/SignIn");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchPosts();
    fetchUsers();
  }, []);

  useEffect(() => {
    const chatContainer = messagesRef.current;

    const handleScroll = () => {
      const isAtBottom =
        chatContainer.scrollHeight -
          chatContainer.scrollTop -
          chatContainer.clientHeight <=
        100;

      setUserScrolledUp(!isAtBottom);
    };

    chatContainer.addEventListener("scroll", handleScroll);

    return () => {
      chatContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesRef.current && !userScrolledUp && !isInitial) {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({
            behavior: "smooth",
          });
        }, 100);
      } else if (isInitial && messagesRef.current) {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({
            behavior: "instant",
          });
          setIsInitial(false);
        }, 100);
      }
    };

    if (posts.length > 0) {
      scrollToBottom();
    }
  }, [posts]);
  

  useEffect(() => {
    channel.subscribe("new_post", (data) => {
      const newPost = data.data;
      setPosts((prevPosts) => [...prevPosts, newPost]);
    });

    ably.connection.on("disconnected", () => {
      alert("Realtime disconnected. Try checking network and refreshing");
    });

    return () => {
      channel.unsubscribe();
      ably.connection.off();
      ably.close();
    };
  }, []);

  return (
    <div
      className={`flex flex-col gap-[.4rem] overflow-y-scroll ${
        shrink ? "h-[65vh] sm:h-[59vh]" : "h-[70svh]"
      }`}
      ref={messagesRef}
    >
      {posts.length !== 0 && users.length !== 0 ? (
        posts.map((post) => {
          const sender = users.find((u) => u.id === post.postedById) || {
            username: "DELETED",
          };
          return (
            <GlobalPost
              key={post.id}
              post={post}
              sender={sender}
              images={post.images}
              setDialogOpen={setDialogOpen}
              setSelectedUrl={setSelectedUrl}
            />
          );
        })
      ) : (
        <div className="h-full w-full grid place-items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="5rem"
            height="5rem"
            viewBox="0 0 24 24"
          >
            <rect width="10" height="10" x="1" y="1" fill="currentColor" rx="1">
              <animate
                id="svgSpinnersBlocksShuffle30"
                fill="freeze"
                attributeName="x"
                begin="0;svgSpinnersBlocksShuffle3b.end"
                dur="0.2s"
                values="1;13"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle31"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle38.end"
                dur="0.2s"
                values="1;13"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle32"
                fill="freeze"
                attributeName="x"
                begin="svgSpinnersBlocksShuffle39.end"
                dur="0.2s"
                values="13;1"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle33"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle3a.end"
                dur="0.2s"
                values="13;1"
              ></animate>
            </rect>
            <rect
              width="10"
              height="10"
              x="1"
              y="13"
              fill="currentColor"
              rx="1"
            >
              <animate
                id="svgSpinnersBlocksShuffle34"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle30.end"
                dur="0.2s"
                values="13;1"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle35"
                fill="freeze"
                attributeName="x"
                begin="svgSpinnersBlocksShuffle31.end"
                dur="0.2s"
                values="1;13"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle36"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle32.end"
                dur="0.2s"
                values="1;13"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle37"
                fill="freeze"
                attributeName="x"
                begin="svgSpinnersBlocksShuffle33.end"
                dur="0.2s"
                values="13;1"
              ></animate>
            </rect>
            <rect
              width="10"
              height="10"
              x="13"
              y="13"
              fill="currentColor"
              rx="1"
            >
              <animate
                id="svgSpinnersBlocksShuffle38"
                fill="freeze"
                attributeName="x"
                begin="svgSpinnersBlocksShuffle34.end"
                dur="0.2s"
                values="13;1"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle39"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle35.end"
                dur="0.2s"
                values="13;1"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle3a"
                fill="freeze"
                attributeName="x"
                begin="svgSpinnersBlocksShuffle36.end"
                dur="0.2s"
                values="1;13"
              ></animate>
              <animate
                id="svgSpinnersBlocksShuffle3b"
                fill="freeze"
                attributeName="y"
                begin="svgSpinnersBlocksShuffle37.end"
                dur="0.2s"
                values="1;13"
              ></animate>
            </rect>
          </svg>
        </div>
      )}
       <div ref={bottomRef}></div>
    </div>
  );
}
