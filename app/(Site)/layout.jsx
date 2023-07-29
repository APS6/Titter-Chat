import '../globals.css'
import { AuthContextProvider } from '@/context/authContext'
import Sidebar from '@/components/Sidebar'
import MobileBar from '@/components/mobileBar'

export const metadata = {
  title: 'Titter | The chat app',
  description: 'Titter is a new birb chat app which is completely different than its competitors twitter discord and threads? Titter is just better than all of them',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className='bg-[#000]'>
        <AuthContextProvider>
          <div className='h-[100dvh] w-full p-4 flex flex-col md:flex-row gap-4'>
        <Sidebar />
        <MobileBar />
        <main className='w-full md:w-3/4 max-w-4xl m-auto md:px-5 h-full'>
            {children}
        </main>
        </div>
        </AuthContextProvider>
        </body>
    </html>
  )
}
