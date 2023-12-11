import * as ContextMenu from "@radix-ui/react-context-menu";
import DMMessage from "./dmMessage";

export default function DMContextMenu({
  message,
  divRef,
  cUsername,
  setReplying,
  setReplyingTo,
}) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <DMMessage
          cUsername={cUsername}
          divRef={divRef}
          message={message}
          setReplying={setReplying}
          setReplyingTo={setReplyingTo}
        />
      </ContextMenu.Trigger>
    </ContextMenu.Root>
  );
}
