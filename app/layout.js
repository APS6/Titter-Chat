import './globals.css'

export const metadata = {
    title: 'Titter | The chat app',
    description: 'Titter Chat the birb app. Titter is a new birb chat app which is completely different than its competitors twitter, discord and threads? Titter is just better than all of them. By Anirudha Pratap Sah',
    openGraph: {
        title: "Titter Chat - The Birb App",
        description: "Start chatting with your friends and the world on Titter",
        url: 'https://titter-chat.vercel.app',
        siteName: 'Titter',
        locale: 'en_US',
        images: [
            {
                url: 'https://titter-chat.vercel.app/opengraph.jpeg',
                alt: "Titter Chat The Birb App",
                width: 886,
                height: 436,
            }
        ]
    },
    generator: 'Next.js',
    keywords: ['Titter', 'chat', 'social media', 'titter-chat'],
    
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            {children}
        </html>
    )
}
