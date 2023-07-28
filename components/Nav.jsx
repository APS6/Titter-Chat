import Link from "next/link"
import Image from "next/image"
export default function Nav() {
  return (
    <div className="w-full fixed flex justify-center items-center z-50">
    <nav className="flex px-5 w-full max-w-5xl justify-between items-center py-4">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/birblogo.png" alt="Logo" width="34" height="25"/>
        <h3 className="text-3xl"> Titter</h3>
        </Link>
        <Link href='/SignIn'><button className="bg-purple text-[#fff] px-4 py-2 rounded-lg">Login</button></Link>
    </nav>
    </div>
  )
}
