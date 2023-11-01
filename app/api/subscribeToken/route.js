import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";


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
        admin.messaging().subscribeToTopic(body.token, userId).then(() => {
            return NextResponse.json({ success: true }, { status: 200 });
        }).catch((error) => {
            console.error('Error subscribing user to topic:', error);
            return NextResponse.json({ error: 'Error subscribing to topic', success: false }, { status: 500 });
        });
    } catch (error) {
        console.error('Request error', error);
        NextResponse.json({ error: 'Error Saving token', success: false }, { status: 500 });
    }
}