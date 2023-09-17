import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import Ably from 'ably'
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";

const prisma = new PrismaClient()

const realtime = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = realtime.channels.get('global');

export async function POST(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        } else if (userId === body.postedById) {
            const postData = {
                content: body.content,
                postedById: body.postedById,
            }
            if (body.images.length > 0) {
                const imageArray = body.images.map((img) => {
                    return {
                        imageUrl: img.imageUrl, width: img.width, height: img.height
                    }
                })
                postData.images = {
                    create:
                        imageArray
                    ,
                }
            }
            const newPost = await prisma.post.create({
                data: postData,
                include: {
                    images: true,
                    postedBy: {
                        select: {
                            pfpURL: true,
                            username: true,
                        }
                    }
                }
            }
            )
            channel.publish('new_post', newPost);
            return NextResponse.json(newPost, { success: true }, { status: 200 });
        }
        else {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        }
    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error creating Post', success: false }, { status: 500 });
    }
}

export async function GET(req) {

    const { searchParams } = new URL(req.url);
    let cursor = searchParams.get("cursor");
    try {
        const posts = await prisma.post.findMany({
            include: {
                likes: true,
                images: true,
                postedBy: {
                    select: {
                        username: true,
                        pfpURL: true,
                    }
                }
            },
            orderBy: {
                postedAt: "desc"
            },
            skip: cursor ? 1 : 0,
            take: 15,
            cursor: cursor ? {
                id: cursor,
            } : undefined
        });

        let nextCursor = null;

        if (posts.length === 15) {
            nextCursor = posts[15 - 1].id;
        }
        return NextResponse.json({ items: posts, nextCursor }, { status: 200 });
    } catch (error) {
        console.error('Error retrieving posts', error);
        return NextResponse.json({ error: 'Error retrieving posts', success: false }, { status: 500 });
    }
}