import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(req, { params }) {
    const { username } = params;
    const { id } = params;
    try {
        const userData = await prisma.user.findFirst({
            include: {
                likes: {
                    orderBy: {
                        post: {
                            postedAt: "desc"
                        }
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
                                }
                            }
                        },
                    }
                },
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
                        }
                    },
                },
                followedBy: {
                    select: {
                        followerId: true,
                    }
                },
                following: {
                    select: {
                        followingId: true,
                    }
                },
            },
            where: {
                username: username,
            }
        });
        if (userData === null) {
            return NextResponse.json({ error: 'User not found', success: false }, { status: 404 });
        }
        const user = {
            id: userData.id,
            bio: userData.bio,
            username: userData.username,
            pfpURL: userData.pfpURL,
        }
        const followedBy = userData.following.some((u) => u.followingId === id)
        const following = userData.followedBy.some((u) => u.followerId === id)
        const followerCount = userData.followedBy.length
        const followingCount = userData.following.length
        return NextResponse.json({
            user: user,
            likes: userData.likes,
            posts: userData.posts,
            followedBy: followedBy,
            following: following,
            followerCount: followerCount,
            followingCount: followingCount,
        }, { status: 200 });
    } catch (error) {
        console.error('Error retrieving user data', error);
        NextResponse.json({ error: 'Error retrieving user data', success: false }, { status: 500 });
    }
}