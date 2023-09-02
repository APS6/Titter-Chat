import '../globals.css'
import Nav from '@/components/Nav'

export const metadata = {
  title: 'Titter the birb app',
  description: 'Titter Chat the birb app. Titter is a new birb chat app which is completely different than its competitors twitter, discord and threads? Titter is just better than all of them. By Anirudha Pratap Sah',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className='bg-[#000]'>
        <Nav />
        <main className='w-full px-5 gradient overflow-x-hidden relative'>
            {children}
        </main>
      </body>
    </html>
  )
}
