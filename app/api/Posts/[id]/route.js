import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, {params}) {
    const { id } = params;
    try {
        const post = await prisma.post.findFirst({
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