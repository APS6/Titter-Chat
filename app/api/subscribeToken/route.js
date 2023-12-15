
import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";
import { headers } from "next/headers";


export async function POST(req) {
    const body = await req.json()
    try {
        const subscribe = await admin.messaging().subscribeToTopic(body.token, userId).then(() => {
            return true
        }).catch((error) => {
            console.error('Error subscribing user to topic:', error);
            return false
        });
        if (!subscribe) {
            return NextResponse.json({ error: 'Error subscribing to topic', success: false }, { status: 500 });
        }
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error Saving token', success: false }, { status: 500 });
    }
}