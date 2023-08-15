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
            const newMessage = await prisma.directMessage.create({
                data: {
                    content: body.content,
                    sentById: body.sentById,
                    sentToId: body.sentToId
                }
            })
            newMessage.sentByUsername = body.sentByUsername
            channel.publish(`m_${body.sentById}_${body.sentToUsername}`, newMessage);
            channel.publish(`m_${body.sentToId}`, newMessage);

            channel.publish(`ms_${body.sentById}`, newMessage);
            channel.publish(`mr_${body.sentToId}`, newMessage);
            return NextResponse.json(newMessage, { success: true }, { status: 200 });
        }
        else {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        }
    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error sending message', success: false }, { status: 500 });
    }
}

