import Messages from "@/components/messages";
import Input from "@/components/input";

export const metadata = {
  title: "Home | Titter the chat app",
  description:
    "Home page of Titter the chat app. Titter is a new birb chat app which is completely different than its competitors twitter discord and threads? Titter is just better than all of them",
};

export default function Home() {
  return (
    <div className="full-height px-1 flex flex-col">
      <Messages />
      <Input />
    </div>
  );
}
