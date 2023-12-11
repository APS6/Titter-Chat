import * as ContextMenu from "@radix-ui/react-context-menu";
import GlobalPost from "./globalPost";

export default function PostContextMenu({ post, divRef, cUser }) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <GlobalPost divRef={divRef} post={post} cUser={cUser} />
      </ContextMenu.Trigger>
    </ContextMenu.Root>
  );
}
