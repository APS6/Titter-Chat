import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import admin from "@/app/lib/firebaseAdmin"

const prisma = new PrismaClient()

export async function GET(req, {params}) {
    const token = params.id[0]
    const id2 = params.id[1]
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        if (!userId) {
            return NextResponse.json({ error: 'Failed Authorization', success: false }, { status: 400 });
        } else if (userId){
        const messages = await prisma.directMessage.findMany({
            where: {
                OR: [
                    {
                        sentById: userId,
                        sentToId: id2,
                    },
                    {
                        sentById: id2,
                        sentToId: userId,
                    },
                ]
            },
            include: {
                images: true,
            }
        }
        );
        return NextResponse.json(messages, { status: 200 });}
    } catch (error) {
        console.error('Error retrieving messages', error);
        return NextResponse.json({ error: 'Error retrieving messages', success: false }, { status: 500 });
    }
}