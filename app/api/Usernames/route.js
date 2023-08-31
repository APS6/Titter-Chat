import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET() {
    try {
        const usernames = await prisma.user.findMany({
            select: {
                id: false,
                username: true,
                pfpURL: false,
                bio: false,
                email: false,
            }
        });
        return NextResponse.json(usernames, { status: 200 });
    } catch (error) {
        console.error('Error retrieving usernames', error);
        NextResponse.json({ error: 'Error retrieving usernames', success: false }, { status: 500 });
    }
}