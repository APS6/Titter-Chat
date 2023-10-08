import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, {params}) {
    const { id } = params;
    try {
        const user = await prisma.user.findFirst({
            select: {
                id: true,
                username: true,
                pfpURL: true,
                bio: true,
            },
            where: {
                id: id,
            }
        });
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error('Error retrieving user data', error);
        return NextResponse.json({ error: 'Error retrieving user data', success: false }, { status: 500 });
    }
}