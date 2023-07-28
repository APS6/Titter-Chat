import '../globals.css'
import Nav from '@/components/Nav'

export const metadata = {
  title: 'Titter the birb app',
  description: 'Titter is a new birb chat app which is completely different than its competitors twitter discord and threads? Titter is just better than all of them',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className='bg-grey'>
        <Nav />
        <main className='w-full max-w-5xl m-auto px-5'>
        {children}
        </main>
        </body>
    </html>
  )
}
