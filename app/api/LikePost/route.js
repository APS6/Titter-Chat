import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import Ably from 'ably'

const prisma = new PrismaClient()

const realtime = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = realtime.channels.get('likes');

export async function POST(req) {
    const body = await req.json()
    try {
        const newLike = await prisma.like.create({
            data: {
                userId: body.userId,
                postId: body.postId,
            }
        })
        channel.publish('new_like', {userId: body.userId, postId: body.postId, action: "like"});
        return NextResponse.json(newLike, { success: true }, { status: 200 });
    } catch (error) {
        console.error('Request error', error);
        NextResponse.json({ error: 'Error Liking Post', success: false }, { status: 500 });
    }
}
export async function DELETE(req) {
    const body = await req.json()
    try {
        const deletedLike = await prisma.like.delete({
            where: {
                postId_userId: {
                    userId: body.userId,
                    postId: body.postId,
                },
            },
        })
        channel.publish('new_like', {userId: body.userId, postId: body.postId, action: "dislike"});
        return NextResponse.json(deletedLike, { success: true }, { status: 200 });
    } catch (error) {
        console.error('Request error', error);
        NextResponse.json({ error: 'Error disliking Post', success: false }, { status: 500 });
    }
}
