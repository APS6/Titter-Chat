import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin"

export async function GET(req, {params}) {
    const { username, token } = params;
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        } else if (userId){
        const user = await prisma.user.findFirst({
            select: {
                username: true,
                pfpURL: true,
                id: true,
                following: {
                    where: {
                        followingId: userId
                    },
                select: {
                    following: {
                        select: {
                            username: true,
                        }
                    }
                }
                }
            },
            where: {
                username: username
            }
        });
        if (user.following.length === 0) {
            return NextResponse.json({user: user, following: false, currentUser: user.following[0].following.username}, { status: 200 });
        }
        return NextResponse.json({user: user, following: true, currentUser: user.following[0].following.username }, { status: 200 });
    }
    } catch (error) {
        console.error('Error retrieving user data', error);
        return NextResponse.json({ error: 'Error retrieving user data', success: false }, { status: 500 });
    }
}