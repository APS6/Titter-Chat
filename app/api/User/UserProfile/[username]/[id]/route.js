import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    const { username } = params;
    const { id } = params;
    try {
        const userData = await prisma.user.findFirst({
            include: {
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
            return NextResponse.json(null, { status: 404 });
        }
        const followedBy = userData.following.some((u) => u.followingId === id)
        const following = userData.followedBy.some((u) => u.followerId === id)
        const followerCount = userData.followedBy.length
        const followingCount = userData.following.length
        return NextResponse.json({
            id: userData.id,
            bio: userData.bio,
            username: userData.username,
            pfpURL: userData.pfpURL,
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