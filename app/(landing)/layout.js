
import Nav from '@/components/Nav'

export default function Layout({ children }) {
  return (
      <body className='bg-[#000] overflow-x-hidden'>
        <Nav />
        <main className='w-full px-5 max-w-5xl m-auto'>
            {children}
        </main>
      </body>
  )
}
