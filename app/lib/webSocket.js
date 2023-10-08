import Ably from 'ably'

export const ably = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
