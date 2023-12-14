import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";
import { ably } from "@/app/lib/webSocket";
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";

export async function POST(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        }
        if (body.content.length === 0 && body.images.length === 0) {
            return NextResponse.json({ error: 'Message cannot be empty', success: false }, { status: 401 });
        }
        const messageData = {
            content: body.content,
            sentById: userId,
            sentToId: body.sentToId
        }
        if (body.images.length > 0) {
            const imageArray = body.images.map((img) => { return { imageUrl: img.imageUrl } })
            messageData.images = {
                create: imageArray,
            }
        }
        if (body.replyToId) {
            messageData.reply = {
                create: {
                    replyToId: body.replyToId
                }
            }
        }
        const newMessage = await prisma.directMessage.create({
            data: messageData,
            include: {
                images: true,
                reply: {
                    select: {
                        replyToId: true,
                        replyToMessage: {
                            select: {
                                content: true,
                                images: true,
                            }
                        }
                    }
                },
                sentTo: {
                    select: {
                        username: true,
                        pfpURL: true,
                        enableNotifications: true,
                        notifyDMs: true,
                    }
                },
                sentBy: {
                    select: {
                        username: true,
                        pfpURL: true,
                    }
                }
            }
        })
        const dmChannel = ably.channels.get(`dm-${body.sentToId}-${newMessage.sentBy.username}`)
        dmChannel.publish(`new`, newMessage);

        const ms = {
            content: newMessage.content,
            sentAt: newMessage.sentAt,
            id: newMessage.sentToId,
            username: newMessage.sentTo.username,
            pfpURL: newMessage.sentTo.pfpURL,
        }
        const sidebarSender = ably.channels.get(`sidebar-${body.sentById}`)
        sidebarSender.publish(`message`, ms);
        const mr = {
            content: newMessage.content,
            sentAt: newMessage.sentAt,
            id: newMessage.sentById,
            username: newMessage.sentBy.username,
            pfpURL: newMessage.sentBy.pfpURL,
        }
        const sidebarReceiver = ably.channels.get(`sidebar-${body.sentToId}`)
        sidebarReceiver.publish(`message`, mr);

        if (newMessage.sentTo.enableNotifications && newMessage.sentTo.notifyDMs) {
            const message = {
                topic: body.sentToId,
                notification: {
                    title: `${newMessage.sentBy.username} sent a message`,
                    body: newMessage.content
                },
                data: {
                    disabledPath: `/DMs/${newMessage.sentBy.username}`,
                    linkPath: `/DMs/${newMessage.sentBy.username}?id=${newMessage.sentById}`
                },
                webpush: {
                    notification: {
                        icon: "https://titter-chat.vercel.app/newlogo.png"
                    },
                    fcmOptions: {
                        link: `https://titter-chat.vercel.app/DMs/${newMessage.sentBy.username}?id=${userId}`
                    }
                }
            }
            admin.messaging().send(message)
        }

        return NextResponse.json(newMessage, { success: true }, { status: 200 });
    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error sending message', success: false }, { status: 500 });
    }
}

export async function DELETE(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 401 });
        }

        const message = await prisma.directMessage.findFirst({
            where: {
                id: body.messageId,
            },
            select: {
                id: true,
                sentById: true,
            }
        })

        if (!message) {
            return NextResponse.json({ error: 'Message does not exist', success: false }, { status: 404 });
        }

        if (message.sentById !== userId) {
            return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
        }
        const deleted = await prisma.directMessage.delete({
            where: {
                id: body.messageId
            },
            select: {
                id: true,
                sentById: true,
                sentBy: {
                    select: {
                        username: true,
                    }
                },
                sentToId: true,
            }
        })
        const dmChannel = ably.channels.get(`dm-${deleted.sentToId}-${deleted.sentBy.username}`)
        dmChannel.publish(`deleted`, { id: deleted.id });
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error deleting Post', success: false }, { status: 500 });
    }
}

export async function PATCH(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 401 });
        }
        const message = await prisma.directMessage.findFirst({
            where: {
                id: body.messageId,
            },
            select: {
                id: true,
                sentById: true,
                content: true,
            }
        })
        if (!message) {
            return NextResponse.json({ error: 'Message does not exist', success: false }, { status: 404 });
        }

        if (message.sentById !== userId) {
            return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
        }
        const newMessage = await prisma.directMessage.update({
            where: {
                id: body.messageId
            },
            data: {
                content: body.content,
                edited: true
            },
            include: {
                images: true,
                reply: {
                    select: {
                        replyToId: true,
                        replyToMessage: {
                            select: {
                                content: true,
                                images: true,
                            }
                        }
                    }
                },
                sentBy: {
                    select: {
                        username: true
                    }
                }
            },
        })
        const dmChannel = ably.channels.get(`dm-${newMessage.sentToId}-${newMessage.sentBy.username}`)
        dmChannel.publish(`edited`, newMessage);
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error modifying Post', success: false }, { status: 500 });
    }
}
