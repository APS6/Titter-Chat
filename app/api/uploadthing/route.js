import { createNextRouteHandler } from "uploadthing/next";
import { UTApi } from "uploadthing/server";

import { ourFileRouter } from "./core";
import { NextResponse } from "next/server";

export const utapi = new UTApi();

// Export routes for Next App Router
export const { GET, POST } = createNextRouteHandler({
  router: ourFileRouter,
});

export async function DELETE(req) {
  const body = await req.json()
  try {
    await utapi.deleteFiles(body.key)
    return NextResponse.json({ success: true }, { status: 200 })
  }
  catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error deleting image', success: false }, { status: 500 });
  }
}