import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function POST(req) {
    const body = await req.json()
    try {
        const newUser = await prisma.user.create({
            data: {
                id: body.id,
                username: body.username,
                email: body.email,
                pfpURL: body.pfpURL,
            }
        })
        return NextResponse.json(newUser, { success: true }, { status: 200 });
    } catch (error) {
        console.error('Request error', error);
        NextResponse.json({ error: 'Error creating User', success: false }, { status: 500 });
    }
}

export async function GET() {
    try {
        const users = await prisma.user.findMany();
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('Error retrieving users', error);
        NextResponse.json({ error: 'Error retrieving users', success: false }, { status: 500 });
    }
}