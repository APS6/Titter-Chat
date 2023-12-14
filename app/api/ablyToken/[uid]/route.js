import { NextResponse } from "next/server";
import Ably from "ably/promises";

const rest = new Ably.Rest(process.env.NEXT_PUBLIC_ABLY_API_KEY);

function createTokenPromise(tokenParams) {
    return new Promise((resolve, reject) => {
        rest.auth.createTokenRequest(tokenParams, (err, tokenRequest) => {
            if (err) {
                reject(new Error("Error requesting token: " + JSON.stringify(err)));
            } else {
                resolve(tokenRequest);
            }
        });
    });
}

export async function GET(req, { params }) {
    const { uid } = params;
    const tokenParams = {
        clientId: uid,
    };

    try {
        const tokenRequest = await createTokenPromise(tokenParams);

        return NextResponse.json(tokenRequest, { success: true }, { status: 200 });
    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json(
            { error: 'Error generating Web Socket Token', success: false },
            { status: 500 }
        );
    }
}
