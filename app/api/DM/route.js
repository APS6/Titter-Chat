import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";
import { ably } from "@/app/lib/webSocket";
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";

const channel = ably.channels.get("dm");

export async function POST(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        } else if (userId === body.sentById) {
            const messageData = {
                content: body.content,
                sentById: body.sentById,
                sentToId: body.sentToId
            }
            if (body.images.length > 0) {
                const imageArray = body.images.map((img) => { return { imageUrl: img.imageUrl } })
                messageData.images = {
                    create: imageArray,
                }
            }
            const newMessage = await prisma.directMessage.create({
                data: messageData,
                include: {
                    images: true,
                    sentTo: {
                        select: {
                            username: true,
                            pfpURL: true,
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
            channel.publish(`m_${body.sentById}`, newMessage);
            channel.publish(`m_${body.sentToId}`, newMessage);

            const ms = {
                content: newMessage.content,
                sentAt: newMessage.sentAt,
                id: newMessage.sentToId,
                username: newMessage.sentTo.username,
                pfpURL: newMessage.sentTo.pfpURL,
            }
            channel.publish(`ms_${body.sentById}`, ms);
            const mr = {
                content: newMessage.content,
                sentAt: newMessage.sentAt,
                id: newMessage.sentById,
                username: newMessage.sentBy.username,
                pfpURL: newMessage.sentBy.pfpURL,
            }
            channel.publish(`mr_${body.sentToId}`, mr);
            return NextResponse.json({ success: true }, { status: 200 });
        }
        else {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        }
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
                postedById: true,
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
                sentToId: true,
            }
        })
        channel.publish(`delete_dm_${deleted.sentToId}`, {id: deleted.id });
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

        if (message.postedById !== userId) {
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
            },
        })
        channel.publish(`edit_dm_${newMessage.sentToId}`, newMessage);
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error modifying Post', success: false }, { status: 500 });
    }
}
