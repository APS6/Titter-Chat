import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";

export async function POST(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    if (!isValidEmail(body.email)) {
        NextResponse.json({ error: 'Invalid Email address', success: false }, { status: 400 });
    } else if (body.username.length < 3 && body.username.length > 9 && body.bio.length > 60) {
        NextResponse.json({ error: 'Invalid Data: username must be longer than 3, less than 9 characters, bio should be less than 60 characters', success: false }, { status: 400 });
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

function isValidEmail(email) {
    // Regular expression for basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}