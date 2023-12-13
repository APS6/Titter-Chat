import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    const { username } = params;
    try {
        const followers = await prisma.user.findFirst({
            select: {
                followedBy: {
                    select: {
                        follower: {
                            select: {
                                username: true,
                                pfpURL: true,
                                id: true,
                            }
                        }
                    }
                }
            }, where: {
                username: username
            }
        })
        const followingData = await prisma.user.findFirst({
            select: {
                following: {
                    select: {
                        following: {
                            select: {
                                username: true,
                                pfpURL: true,
                                id: true,
                            }
                        }
                    }
                }
            }, where: {
                username: username
            }
        })
        const followersData = followers.followedBy.map((u) => {
            const following = followingData.following.some((f) => f.following.id === u.follower.id)
            if (following) {
                return { ...u, following: true }
            } else return { ...u, following: false }
        })
        return NextResponse.json({ followers: followersData, following: followingData.following }
            , { status: 200 });
    } catch (error) {
        console.error('Error retrieving user data', error);
        return NextResponse.json({ error: 'Error retrieving user data', success: false }, { status: 500 });
    }
}