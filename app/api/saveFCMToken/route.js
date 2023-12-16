
import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";
import { prisma } from "@/app/lib/db";

export async function POST(req) {
    const body = await req.json()
    const headersList = headers();
    const accessToken = headersList.get("authorization");

    try {
        const decodedToken = await admin.auth().verifyIdToken(accessToken);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        }
        const check = await prisma.fCMToken.findFirst({
            where: {
                value: body.token
            }
        })
        if (!check) {
            await prisma.fCMToken.create({
                data: {
                    userId: userId,
                    value: body.token
                }
            })
        }
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error Saving token', success: false }, { status: 500 });
    }
}