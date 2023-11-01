import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";

export async function POST(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        } else if (userId === body.followingId){
            return NextResponse.json({ error: 'Cannot follow yourself', success: false }, { status: 400 });
        } else if (userId === body.followerId) {
            const newFollow = await prisma.follows.create({
                data: {
                    followerId: body.followerId,
                    followingId: body.followingId,
                },
                include: {
                    follower: {
                        select: {
                            username: true,
                            pfpURL: true,
                        }
                    },
                    following: {
                        select: {
                            username: true,
                        }
                    }
                }
            })

            const message = {
                topic: body.followingId,
                notification: {
                    title: `${newFollow.follower.username} followed you`,
                },
                webpush: {
                    notification: {
                        icon: "https://titter-chat.vercel.app/newlogo.png",
                        image: newFollow.follower.pfpURL
                    },
                    fcmOptions: {
                        link: `https://titter-chat.vercel.app/profile/${newFollow.following.username}`
                    }
                }
            }
            admin.messaging().send(message)

            return NextResponse.json({ success: true }, { status: 200 });
        }
        else {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        }
    } catch (error) {
        console.error('Request error', error);
        NextResponse.json({ error: 'Error following user', success: false }, { status: 500 });
    }
}
export async function DELETE(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");


    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        } else if (userId === body.followerId) {
            const deletedFollow = await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: body.followerId,
                        followingId: body.followingId,
                    },
                },
                include: {
                    follower: {
                        select: {
                            username: true,
                            pfpURL: true,
                        }
                    },
                    following: {
                        select: {
                            username: true,
                        }
                    }
                }
            })

            const message = {
                topic: body.followingId,
                notification: {
                    title: `${deletedFollow.follower.username} unfollowed you`,
                },
                webpush: {
                    notification: {
                        icon: "https://titter-chat.vercel.app/newlogo.png",
                        image: deletedFollow.follower.pfpURL
                    },
                    fcmOptions: {
                        link: `https://titter-chat.vercel.app/profile/${deletedFollow.following.username}`
                    }
                }
            }
            admin.messaging().send(message)

            return NextResponse.json({ success: true }, { status: 200 });
        } else {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        }
    } catch (error) {
        console.error('Request error', error);
        NextResponse.json({ error: 'Error unfollowing user', success: false }, { status: 500 });
    }
}
