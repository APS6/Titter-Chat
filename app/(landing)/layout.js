
import Nav from '@/components/Nav'

export default function Layout({ children }) {
  return (
      <body className='bg-[#000]'>
        <Nav />
        <main className=''>
            {children}
        </main>
      </body>
  )
}
