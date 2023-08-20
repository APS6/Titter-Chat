import '../globals.css'
import Loading from './loading'
import { Suspense } from 'react'
import { AuthContextProvider } from '@/context/authContext'

export const metadata = {
  title: 'SignIn | Titter the birb app',
  description: 'SignIn to Titter Chat. Titter is a new birb chat app which is completely different than its competitors twitter discord and threads? Titter is just better than all of them',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className='bg-[#000]'>
        <main className='w-full max-w-5xl m-auto px-5'>
        <Suspense fallback={<Loading />}>
          <AuthContextProvider>
            {children}
            </AuthContextProvider>
          </Suspense>
        </main>
        </body>
    </html>
  )
}
