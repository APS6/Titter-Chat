import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(req, {params}) {
    const userId = params.id
    try {
        const user = await prisma.user.findFirst({
            select: {
                id: true,
                username: true,
                pfpURL: true,
                bio: true,
                email: false,
            },
            where: {
                id: userId
            }
        });
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error('Error retrieving user', error);
        NextResponse.json({ error: 'Error retrieving user', success: false }, { status: 500 });
    }
}