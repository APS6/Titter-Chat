import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import admin from "@/app/lib/firebaseAdmin"

const prisma = new PrismaClient()

export async function GET(req, { params }) {
    const token = params.id[0]
    const us = params.id[1]
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        } else if (userId) {
            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        {
                            id: userId,
                        },
                        {
                            username: us,
                        },
                    ]
                },
                include: {
                    followedBy: true,
                },
                select: {
                    id: true,
                    username: true,
                    pfpURL: true,
                    email: false,
                    bio: false,
                }
            }
            );
            return NextResponse.json(users, { status: 200 });
        }
    } catch (error) {
        console.error('Error retrieving messages', error);
        return NextResponse.json({ error: 'Error retrieving messages', success: false }, { status: 500 });
    }
}