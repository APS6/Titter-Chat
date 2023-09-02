import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen grid place-items-center">
      <div className="flex flex-col items-center md:w-3/4">
      <h1 className="text-5xl sm:text-7xl text-center text-bold">
        Titter Chat <br /> The Birb App
      </h1>
      <p className="mt-10 mb-8 text-lg md:text-xl text-center">
        People who wish to be successful use twitter, People who are successful use Titter, Peasants use other apps.
      </p>
      <Link href="/Home"><button className="bg-purple text-[#fff] p-4 rounded-md text-xl">Start Chatting</button></Link>
    </div>
    </div>
  );
}
