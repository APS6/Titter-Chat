import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    const { id } = params;
    try {
        const settings = await prisma.user.findUnique({
            select: {
                enableNotifications: true,
                notifyLike: true,
                notifyFollow: true,
                notifyDMs: true,
                notifyReplies: true,
                allowDMs: true,
            },
            where: {
                id: id,
            }
        });
        if (!settings) {
            return NextResponse.json({ error: 'User not found', success: false }, { status: 404 });
        }
        return NextResponse.json(settings, { status: 200 });
    } catch (error) {
        console.error('Error retrieving settings', error);
        return NextResponse.json({ error: 'Error retrieving settings', success: false }, { status: 500 });
    }
}