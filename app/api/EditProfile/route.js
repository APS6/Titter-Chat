import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";

export async function POST(req) {
    const body = await req.json()
    const headersList = headers();
    const token = headersList.get("authorization");

    if (body.username.length >= 3 && body.username.length < 10 && body.bio.length < 61) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            const userId = decodedToken.uid;
            if (!userId) {
                return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
            } else if (userId === body.id) {
                const newUser = await prisma.user.update({
                    where: {
                        id: body.id,
                    },
                    data: {
                        username: body.username,
                        bio: body.bio,
                        pfpURL: body.pfp,
                    }
                })
                return NextResponse.json(newUser, { success: true }, { status: 200 });
            } else {
                return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
            }
        } catch (error) {
            console.error('Request error', error);
            return NextResponse.json({ error: 'Error updating User', success: false }, { status: 500 });
        }
    }
    else {
        return NextResponse.json({ error: 'Invalid User', success: false }, { status: 400 });
    }
}
