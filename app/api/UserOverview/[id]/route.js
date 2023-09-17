import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(req, {params}) {
    const { id } = params;
    try {
        const user = await prisma.user.findFirst({
            select: {
                username: true,
                pfpURL: true,
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