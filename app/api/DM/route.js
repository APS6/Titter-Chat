import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import Ably from 'ably'
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";

const prisma = new PrismaClient()

const realtime = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = realtime.channels.get('dm');

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
            const dmMessage = {
                content: newMessage.content,
                images: newMessage.images,
                sentAt: newMessage.sentAt,
                id: newMessage.id,
                sentById: newMessage.sentById,
                sentToId: newMessage.sentToId,
                sentByUsername: body.sentByUsername
            }
            channel.publish(`m_${body.sentById}_${body.sentToUsername}`, dmMessage);
            channel.publish(`m_${body.sentToId}`, dmMessage);

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

