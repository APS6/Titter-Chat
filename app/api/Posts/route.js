import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { ably } from "@/app/lib/webSocket";
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";

const channel = ably.channels.get('global')

export async function POST(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        }
        if (body.content.length === 0 && body.images.length === 0 && body.replyToId === null) {
            return NextResponse.json({ error: 'Post cannot be empty', success: false }, { status: 401 });
        }
        const postData = {
            content: body.content,
            postedById: userId,
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
        if (body.replyToId) {
            postData.reply = {
                create: {
                    replyToId: body.replyToId
                }
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
                                        username: true,
                                        id: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        channel.publish('new_post', newPost);

        if (newPost.reply && userId !== newPost.reply?.replyToPost?.postedBy?.id) {
            const message = {
                topic: newPost.reply.replyToPost.postedBy.id,
                notification: {
                    title: `${newPost.postedBy.username} replied to your post`,
                    body: newPost.content
                },
                webpush: {
                    notification: {
                        icon: "https://titter-chat.vercel.app/newlogo.png",
                    },
                    fcmOptions: {
                        link: `https://titter-chat.vercel.app/post/${newPost.id}`
                    }
                }
            }
            admin.messaging().send(message)
        }

        return NextResponse.json(newPost, { success: true }, { status: 200 });

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
            orderBy: {
                postedAt: "desc"
            },
            take: 16,
            cursor: cursor ? {
                id: cursor,
            } : undefined
        });

        let nextCursor = null;

        if (posts.length === 16) {
            nextCursor = posts[16 - 1].id;
        }
        return NextResponse.json({ items: posts.slice(0, 15), nextCursor }, { status: 200 });
    } catch (error) {
        console.error('Error retrieving posts', error);
        return NextResponse.json({ error: 'Error retrieving posts', success: false }, { status: 500 });
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
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 401 });
        }

        const user = await prisma.user.findFirst({
            where: {
                id: userId,
            },
            select: {
                role: true,
                id: true
            }
        })
        if (!user) {
            return NextResponse.json({ error: 'Member not found', success: false }, { status: 404 });
        }
        const post = await prisma.post.findFirst({
            where: {
                id: body.postId,
            },
            select: {
                id: true,
                postedById: true,
            }
        })
        if (!post) {
            return NextResponse.json({ error: 'Post does not exist', success: false }, { status: 404 });
        }
        const canChange = post.postedById === userId || user.role === 'ADMIN'
        if (!canChange) {
            return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
        }
        const deleted = await prisma.post.delete({
            where: {
                id: body.postId
            },
            select: {
                id: true,
                postedById: true,
            }
        })
        channel.publish('delete_post', { id: deleted.id, removerId: userId });
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error deleting Post', success: false }, { status: 500 });
    }
}

export async function PATCH(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 401 });
        }
        const post = await prisma.post.findFirst({
            where: {
                id: body.postId,
            },
            select: {
                id: true,
                postedById: true,
                content: true,
            }
        })
        if (!post) {
            return NextResponse.json({ error: 'Post does not exist', success: false }, { status: 404 });
        }
        const canChange = post.postedById === userId
        if (!canChange) {
            return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
        }
        const newPost = await prisma.post.update({
            where: {
                id: body.postId
            },
            data: {
                content: body.content,
                edited: true
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
        })
        channel.publish('edit_post', newPost);
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error modifying Post', success: false }, { status: 500 });
    }
}
