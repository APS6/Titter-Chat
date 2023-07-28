import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import Ably from 'ably'

const prisma = new PrismaClient()

const realtime = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = realtime.channels.get('global');

export async function POST(req) {
    const body = await req.json()
    try {
        const newPost = await prisma.post.create({
            data: {
                content: body.content,
                postedById: body.postedById,
            }
        })
        channel.publish('new_post', newPost);
        return NextResponse.json(newPost, { success: true }, { status: 200 });
    } catch (error) {
        console.error('Request error', error);
        NextResponse.json({ error: 'Error creating Post', success: false }, { status: 500 });
    }
}

export async function GET() {
    try {
        const posts = await prisma.post.findMany({
            include: {
                likes: true,
            }
        });
        return NextResponse.json(posts, { status: 200 });
    } catch (error) {
        console.error('Error retrieving posts', error);
        NextResponse.json({ error: 'Error retrieving posts', success: false }, { status: 500 });
    }
}