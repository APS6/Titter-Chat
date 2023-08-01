import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";

const prisma = new PrismaClient()

export async function POST(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    if (!isValidEmail(body.email)) {
        NextResponse.json({ error: 'Invalid Email address', success: false }, { status: 400 });
    } else if (body.username.length < 3 && body.username.length > 10 && body.bio.length > 190) {
        NextResponse.json({ error: 'Invalid Data: uername must be longer than 3, less than 10 characters, bio should be less than 190 characters', success: false }, { status: 400 });
    } else {
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            const userId = decodedToken.uid;
            if (!userId) {
                return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
            } else if (userId === body.id) {
                const newUser = await prisma.user.create({
                    data: {
                        id: body.id,
                        username: body.username,
                        email: body.email,
                        pfpURL: body.pfpURL,
                        bio: body.bio,
                    }
                })
                return NextResponse.json(newUser, { success: true }, { status: 200 });
            } else {
                return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
            }
        } catch (error) {
            console.error('Request error', error);
            NextResponse.json({ error: 'Error creating User', success: false }, { status: 500 });
        }
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

function isValidEmail(email) {
    // Regular expression for basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}