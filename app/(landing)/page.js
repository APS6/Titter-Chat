import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen flex justify-between items-center">
      <div className="md:w-1/2">
        <h1 className="text-6xl sm:text-7xl">
          Yet another <br /> chat app
        </h1>
        <p className="pt-8 pb-6 text-lg">
          Titter is an app no one asked for. It basically is ripoff of twitter
          with better name.
        </p>
        <Link href="/Home"><button className="bg-purple text-[#fff] p-4 rounded-md text-xl">Start Chatting</button></Link>
      </div>
      <Image
        className="hidden md:block md:mt-[-1rem]"
        src="/birblogo.png"
        alt="Hero Birb"
        width="407"
        height="280"
      />
    </div>
  );
}
