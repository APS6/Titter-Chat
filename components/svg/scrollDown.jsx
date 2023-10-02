import { useScrollToBottom, useSticky } from "react-scroll-to-bottom";

export default function ScrollDown() {
  const [sticky] = useSticky()
  const scrollToBottom = useScrollToBottom();

  if (!sticky) {
    return (
      <div onClick={scrollToBottom} className="absolute bottom-16 right-1 p-1 bg-[#000] rounded-full z-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M11 14.2V6q0-.425.288-.713T12 5q.425 0 .713.288T13 6v8.2l2.9-2.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7l-4.6 4.6q-.3.3-.7.3t-.7-.3l-4.6-4.6q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l2.9 2.9Z"
          ></path>
        </svg>
      </div>
    );
  }
}
