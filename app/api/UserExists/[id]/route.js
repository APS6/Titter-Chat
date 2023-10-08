import { prisma } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    const { id } = params;
    try {
        const user = await prisma.user.findUnique({
            select: {
                id: true,
            },
            where: {
                id: id,
            }
        });
        if (user) {
            return NextResponse.json(user, { status: 200 });
        }
        else {
            return NextResponse.json(null, { status: 200 });
        }
    } catch (error) {
        console.error('Error retrieving user data', error);
        return NextResponse.json({ error: 'Error retrieving user data', success: false }, { status: 500 });
    }
}