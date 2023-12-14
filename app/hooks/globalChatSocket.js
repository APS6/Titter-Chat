"use client"
import { useQueryClient } from "@tanstack/react-query";
import { useChannel } from "ably/react";
import { useAuthContext } from "@/context/authContext";
export default function useGlobalSocket() {

    const queryClient = useQueryClient()
    const { user } = useAuthContext()

    const { channel } = useChannel("global", (message) => {
        console.log(message)
        switch (message.name) {
            case "new_post":
                const newPost = message.data;
                if (newPost.postedById !== user.uid) {
                    queryClient.setQueryData(["posts"], (oldData) => {
                        let newData = [...oldData.pages];
                        newData[0] = {
                            ...newData[0],
                            items: [newPost, ...newData[0].items],
                        };

                        return {
                            pages: newData,
                            pageParams: oldData.pageParams,
                        };
                    });
                }
                break;
            case "delete_post":
                const rmPost = message.data;
                if (rmPost.removerId !== user.uid) {
                    queryClient.setQueryData(["posts"], (old) => {
                        const newData = old.pages.map((pg) => {
                            return {
                                ...pg,
                                items: pg.items.reduce((acc, p) => {
                                    if (p.id === rmPost.id) {
                                        return acc;
                                    } else if (p.reply?.replyToId === rmPost.id) {
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
                }
                break;
            case "edit_post":
                const edPost = message.data;
                queryClient.setQueryData(["posts"], (old) => {
                    const newData = old.pages.map((pg) => {
                        return {
                            ...pg,
                            items: pg.items.reduce((acc, p) => {
                                if (p.id === edPost.id) {
                                    acc.push(edPost);
                                } else if (p.reply?.replyToId === edPost.id) {
                                    acc.push({
                                        ...p,
                                        reply: {
                                            ...p.reply,
                                            replyToPost: {
                                                ...p.reply.replyToPost,
                                                content: edPost.content,
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
                break;
        }
    });
}
