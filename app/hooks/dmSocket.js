"use client"
import { useQueryClient } from "@tanstack/react-query";
import { useChannel } from "ably/react";

export default function useDMSocket({ userId, cUsername }) {

    const queryClient = useQueryClient()

    if (userId) {
        const { channel } = useChannel(`dm-${userId}-${cUsername}`, (message) => {
            switch (message.name) {
                case "new":
                    const newMessage = message.data;
                    queryClient.setQueryData(["dm", cUsername], (oldData) => {
                        let newData = [...oldData.pages];
                        newData[0] = {
                            ...newData[0],
                            items: [newMessage, ...newData[0].items],
                        };
                        return {
                            pages: newData,
                            pageParams: oldData.pageParams,
                        };
                    });
                    break;
                case "deleted":
                    const rmMsg = message.data;
                    queryClient.setQueryData(["dm", cUsername], (old) => {
                        const newData = old.pages.map((pg) => {
                            return {
                                ...pg,
                                items: pg.items.reduce((acc, p) => {
                                    if (p.id === rmMsg.id) {
                                        return acc;
                                    } else if (p.reply?.replyToId === rmMsg.id) {
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
                    break;
                case "edited":
                    const edMsg = message.data;
                    queryClient.setQueryData(["dm", cUsername], (old) => {
                        const newData = old.pages.map((pg) => {
                            return {
                                ...pg,
                                items: pg.items.reduce((acc, p) => {
                                    if (p.id === edMsg.id) {
                                        acc.push(edMsg);
                                    } else if (p.reply?.replyToId === edMsg.id) {
                                        acc.push({
                                            ...p,
                                            reply: {
                                                ...p.reply,
                                                replyToMessage: {
                                                    ...p.reply.replyToMessage,
                                                    content: edMsg.content,
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
                    break;
            }
        });
    }
}
