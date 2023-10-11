import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";

export default function ImageDialog({dialogOpen, setDialogOpen, selectedUrl}) {
  return (
    <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#000000] opacity-90 z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Image
            className="object-contain"
            src={selectedUrl}
            alt="Image"
            width={1000}
            height={1000}
            sizes="95vw"
          />
          <a
            className="text-md text-[#4270d1] mt-1"
            href={selectedUrl}
            target="blank"
          >
            Open in Browser
          </a>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
