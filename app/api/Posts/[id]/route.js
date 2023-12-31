import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, {params}) {
    const { id } = params;
    try {
        const post = await prisma.post.findFirst({
            include: {
                likes: true,
                images: true,
                replies: {
                    select: {
                        replyPost: {
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
                                                        username: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        replyPost: {
                            postedAt: "desc"
                        }
                    }
                },
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
                    },
                }
            },
            where: {
                id: id,
            }
        });
        return NextResponse.json(post, { status: 200 });
    } catch (error) {
        console.error('Error retrieving post data', error);
        return NextResponse.json({ error: 'Error retrieving post data', success: false }, { status: 500 });
    }
}