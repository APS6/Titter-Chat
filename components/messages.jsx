"use client";
import { useEffect, useRef, useState } from "react";
import fetchData from "@/app/lib/fetchData";
import Ably from "ably";
import { useAuthContext } from "@/context/authContext";
import { useRouter } from "next/navigation";
import GlobalPost from "./globalPost";

const client = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = client.channels.get("global");

export default function Messages() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const messagesRef = useRef(null);

  const sortPosts = (posts) => {
    return [...posts].sort(
      (a, b) => new Date(a.postedAt) - new Date(b.postedAt)
    );
  };

  if (!user) {
    router.push("/SignIn");
  }

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
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchPosts();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [posts]);

  useEffect(() => {
    channel.subscribe("new_post", (data) => {
      const newPost = data.data;
      setPosts((prevPosts) => [...prevPosts, newPost]);
    });

    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, []);

  return (
    <div
      className="flex flex-col gap-2 scroll-smooth h-[70vh] overflow-scroll"
      ref={messagesRef}
    >
      {posts.map((post) => {
        const sender = users.find((u) => u.id === post.postedById);
        return (
          <GlobalPost key={post.id} post={post} sender={sender}/>
        );
      })}
    </div>
  );
}
