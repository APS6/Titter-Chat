import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            include:{
                sentDM: true,
                receivedDM: true,
            }
        });
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('Error retrieving users', error);
        NextResponse.json({ error: 'Error retrieving users', success: false }, { status: 500 });
    }
}
