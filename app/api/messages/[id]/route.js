import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server"
import admin from "@/app/lib/firebaseAdmin"

export async function GET(req, { params }) {
    const token = params.id
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        } else if (userId) {
            const userMessages = await prisma.user.findUnique({
                where: {
                    id: userId
                },
                include: {
                    sentDM: {
                        take: 10,
                        distinct: ['sentToId'],
                        include: {
                            sentTo: {
                                select: {
                                    id: true,
                                    username: true,
                                    pfpURL: true,
                                }
                            }
                        },
                        orderBy: {
                            sentAt: 'desc'
                        }
                    },
                    receivedDM: {
                        take: 10,
                        distinct: ['sentById'],
                        include: {
                            sentBy: {
                                select: {
                                    id: true,
                                    username: true,
                                    pfpURL: true,
                                }
                            }
                        },
                        orderBy: {
                            sentAt: 'desc'
                        }
                    },
                }
            });
            const user = {
                username: userMessages.username,
                pfpURL: userMessages.pfpURL,
            }
            // add all sentDM
            let messages = userMessages.sentDM.map((dm) => ({ id: dm.sentToId, username: dm.sentTo.username, pfpURL: dm.sentTo.pfpURL, content: dm.content, sentAt: dm.sentAt }))

            for (const dm of userMessages.receivedDM) {
                const exists = messages.find((e) => e.id === dm.sentById)
                // if the same user is already added
                if (exists) {
                    const newer = new Date(dm.sentAt) > new Date(exists.sentAt)

                    if (newer) {
                        const dmIndex = messages.findIndex((msg) => msg.id === exists.id)

                        messages[dmIndex] = {
                            id: dm.sentById,
                            username: dm.sentBy.username,
                            pfpURL: dm.sentBy.pfpURL,
                            content: dm.content,
                            sentAt: dm.sentAt
                        }
                    }
                } else {
                    messages = [...messages, {
                        id: dm.sentById,
                        username: dm.sentBy.username,
                        pfpURL: dm.sentBy.pfpURL,
                        content: dm.content,
                        sentAt: dm.sentAt
                    }]
                }
            }

            const sorted = messages.sort(
                (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
            );

            const sortedMessages = sorted.slice(0, 8)

            return NextResponse.json({ user, messages: sortedMessages }, { status: 200 });
        }
    } catch (error) {
        console.error('Error retrieving messages', error);
        return NextResponse.json({ error: 'Error retrieving messages', success: false }, { status: 500 });
    }
}