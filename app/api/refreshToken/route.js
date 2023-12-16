
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
        const currentTokens = await prisma.fCMToken.findMany()
        const filterTokens = await Promise.all(
            currentTokens.map(async (token) => {
                const twoMonthsAgo = Date.now() - 1000 * 60 * 60 * 24 * 30 * 2;
                if (token.timestamp <= twoMonthsAgo) {
                    await prisma.fCMToken.delete({
                        where: {
                            value: token.value,
                        },
                    });
                } else {
                    return token;
                }
            })
        );

        const tokenExists = filterTokens.some((token) => token.value === body.token)
        if (!tokenExists) {
            await prisma.fCMToken.create({
                data: {
                    value: body.token,
                    userId: userId
                }
            })
        }
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error Saving token', success: false }, { status: 500 });
    }
}