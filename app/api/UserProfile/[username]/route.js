import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(req, {params}) {
    const { username } = params;
    try {
        const user = await prisma.user.findFirst({
            include: {
                likes: {
                    include: {
                        post: {
                            include: {
                                likes: true,
                                images: true,
                            }
                        },
                    }
                },
                posts: {
                    include: {
                        likes: true,
                        images: true,
                    }
                },
                followedBy: true,
                following: true,
            },
            where: {
                username: username,
            }
        });
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error('Error retrieving user data', error);
        NextResponse.json({ error: 'Error retrieving user data', success: false }, { status: 500 });
    }
}