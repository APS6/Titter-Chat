import './globals.css'

export const metadata = {
    title: 'Titter | The chat app',
    description: 'Titter Chat the birb app. Titter is a new birb chat app which is completely different than its competitors twitter, discord and threads? Titter is just better than all of them. By Anirudha Pratap Sah',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            {children}
        </html>
    )
}
