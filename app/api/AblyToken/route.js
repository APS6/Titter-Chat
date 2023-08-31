import { NextResponse } from "next/server";
import Ably from "ably/promises"

const ably = new Ably.Rest({key: process.env.NEXT_PUBLIC_ABLY_API_KEY});

export async function POST(req) {
    const body = await req.json()

    try {
        const tokenDetails = await ably.auth.createTokenRequest({
            clientId: body.userId,
          });
          console.log("tokenDetails :", tokenDetails)
          return NextResponse.json({ token: tokenDetails });
    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error generating Web Socket Token', success: false }, { status: 500 });
    }
}

// this does not work lmk if can make it work