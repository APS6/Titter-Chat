import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    const { username } = params;
    const { searchParams } = new URL(req.url);
    let cursor = searchParams.get("cursor");
    try {
        const userPosts = await prisma.user.findFirst({
            select: {
                posts: {
                    orderBy: {
                        postedAt: 'desc'
                    },
                    include: {
                        likes: true,
                        images: true,
                        postedBy: {
                            select: {
                                username: true,
                                pfpURL: true,
                            }
                        },
                        reply: {
                            select: {
                                replyToId: true,
                                replyToPost: {
                                    select: {
                                        content: true,
                                        postedBy: {
                                            select: {
                                                pfpURL: true,
                                                username: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    take: 11,
                    cursor: cursor ? {
                        id: cursor,
                    } : undefined
                },
            },
            where: {
                username: username,
            }
        });

        if (userPosts === null) {
            return NextResponse.json({ error: 'User not found', success: false }, { status: 404 });
        }
        const posts = userPosts.posts.slice(0, 15)
        let nextCursor = null;

        if (posts.length === 11) {
            nextCursor = posts[11 - 1].id;
        }
        return NextResponse.json({items: posts, nextCursor}, { status: 200 });
    } catch (error) {
        console.error('Error retrieving user data', error);
        NextResponse.json({ error: 'Error retrieving user data', success: false }, { status: 500 });
    }
}