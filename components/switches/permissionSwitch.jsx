import retrieveToken from "@/app/lib/retrieveToken";
import * as Switch from "@radix-ui/react-switch";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/context/authContext";
import { toast } from "sonner";

export default function PermissionSwitch({ enabled, setEnabled }) {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthContext();

  const toggleNotifications = async (enable) => {
    const body = {
      enable,
    };
    try {
      const response = await fetch("/api/settings/NotifPermission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        console.log("Failed to change permissions", response.error);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const HandleEnabled = async (c) => {
    if (c === true) {
      toast.loading("Enabling Notifications, Please wait", {
        id: "loader",
      });
      await retrieveToken(accessToken);
      if (Notification.permission === "granted") {
        queryClient.setQueryData(["settings"], (oldData) => {
          const enableAll =
            !oldData.notifyDMs &&
            !oldData.notifyFollow &&
            !oldData.notifyLike &&
            !oldData.notifyReplies;
          if (enableAll) {
            return {
              ...oldData,
              enableNotifications: true,
              notifyDMs: true,
              notifyFollow: true,
              notifyLike: true,
              notifyReplies: true,
            };
          }
          return { ...oldData, enableNotifications: true };
        });
        setEnabled(true);
        toast.dismiss("loader");
        await toggleNotifications(true);
      }
    }
    if (c === false) {
      setEnabled(false);
      queryClient.setQueryData(["settings"], (oldData) => ({
        ...oldData,
        enableNotifications: false,
      }));
      await toggleNotifications(false);
    }
  };

  return (
    <Switch.Root
      checked={enabled}
      onCheckedChange={(c) => HandleEnabled(c)}
      className="w-[42px] h-[25px] bg-[#DDDDDD] rounded-full data-[state=checked]:bg-[#CAA0FF] "
    >
      <Switch.Thumb className="block w-[21px] h-[21px] bg-[#9D9D9D] rounded-full transition-all duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px] data-[state=checked]:bg-purple" />
    </Switch.Root>
  );
}
