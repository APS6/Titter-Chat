import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";
import { ably } from "@/app/lib/webSocket";
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";

const channel = ably.channels.get('likes');

export async function POST(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        } else if (userId === body.userId) {
            const newLike = await prisma.like.create({
                data: {
                    userId: body.userId,
                    postId: body.postId,
                },
                include: {
                    post: {
                        select: {
                            postedById: true,
                            postedBy: {
                                select: {
                                    enableNotifications: true,
                                    notifyLike: true,
                                    fcmTokens: true
                                }
                            },
                            content: true,
                        }
                    },
                    user: {
                        select: {
                            username: true,
                        }
                    }
                }
            })
            channel.publish('new_like', { userId: body.userId, postId: body.postId, action: "like" });

            if (newLike.post.postedBy.enableNotifications && newLike.post.postedBy.notifyLike) {
                newLike.post.postedBy.fcmTokens.forEach((token) => {
                    const message = {
                        token: token.value,
                        notification: {
                            title: `${newLike.user.username} liked your post`,
                            body: newLike.post.content
                        },
                        webpush: {
                            notification: {
                                icon: "https://titter-chat.vercel.app/newlogo.png",
                            },
                            fcmOptions: {
                                link: `https://titter-chat.vercel.app/post/${newLike.postId}`
                            }
                        }
                    }
                    admin.messaging().send(message)
                })
            }

            return NextResponse.json(newLike, { success: true }, { status: 200 });
        }
        else {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        }
    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error Liking Post', success: false }, { status: 500 });
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
        } else if (userId === body.userId) {
            const deletedLike = await prisma.like.delete({
                where: {
                    postId_userId: {
                        userId: body.userId,
                        postId: body.postId,
                    },
                },
            })
            channel.publish('new_like', { userId: body.userId, postId: body.postId, action: "dislike" });
            return NextResponse.json(deletedLike, { success: true }, { status: 200 });
        } else {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        }
    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error disliking Post', success: false }, { status: 500 });
    }
}
