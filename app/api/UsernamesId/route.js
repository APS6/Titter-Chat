import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const usernames = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                pfpURL: false,
                bio: false,
                email: false,
            }
        });
        return NextResponse.json(usernames, { status: 200 });
    } catch (error) {
        console.error('Error retrieving usernames', error);
        return NextResponse.json({ error: 'Error retrieving usernames', success: false }, { status: 500 });
    }
}