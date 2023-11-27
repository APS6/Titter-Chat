import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    const { username } = params;
    const { searchParams } = new URL(req.url);
    let cursor = searchParams.get("cursor");
    try {
        const userLikes = await prisma.user.findFirst({
            select: {
                likes: {
                    orderBy: {
                        likedAt: "desc"
                    },
                    select: {
                        post: {
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
                            }
                        },
                    },
                    take: 11,
                    cursor: cursor ? {
                        postId: cursor
                    } : undefined
                },
            },
            where: {
                username: username,
            }
        });

        if (userLikes === null) {
            return NextResponse.json({ error: 'User not found', success: false }, { status: 404 });
        }
        const likes = userLikes.likes.slice(0, 15).map((like) => like.post)
        let nextCursor = null;

        if (likes.length === 11) {
            nextCursor = likes[11 - 1].id;
        }
        return NextResponse.json({ items: likes, nextCursor }, { status: 200 });
    } catch (error) {
        console.error('Error retrieving user data', error);
        return NextResponse.json({ error: 'Error retrieving user data', success: false }, { status: 500 });
    }
}