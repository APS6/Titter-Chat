import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import Ably from 'ably'

const prisma = new PrismaClient()

const realtime = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
const channel = realtime.channels.get('test');

export async function GET(req) {
    try {
        const users = await prisma.user.findMany({
            include:{
                sentDM: true,
                receivedDM: true,
            }
        });
        channel.publish('fetched', users);
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('Error retrieving users', error);
        NextResponse.json({ error: 'Error retrieving users', success: false }, { status: 500 });
    }
}
