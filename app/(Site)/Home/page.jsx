import Messages from "@/components/messages";
import Input from "@/components/input";

export const metadata = {
  title: "Home | Titter the chat app",
  description:
    "Home page of Titter the chat app. Titter is a new birb chat app which is completely different than its competitors twitter discord and threads? Titter is just better than all of them",
};

export default function Home() {
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <h1 className="hidden md:block font-bold font-mont text-4xl mb-8">
          Global Chat
        </h1>
          <Messages />
      </div>
      <Input />
    </div>
  );
}
