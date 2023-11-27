import { useAuthContext } from "@/context/authContext";
import * as Switch from "@radix-ui/react-switch";
import { useQueryClient } from "@tanstack/react-query";

export default function ToggleSwitch({ disabled, checked, name }) {

  const queryClient = useQueryClient();
  const { accessToken } = useAuthContext();

  const updateSettings = async (enable) => {
    const body = {
      enable,
      setting: name,
    };
    try {
      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        console.log("Failed to change permissions", response.error);
        queryClient.setQueryData(["settings"], (oldData) => ({
          ...oldData,
          [name]: !enable,
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const switchHandler = async (c) => {
    queryClient.setQueryData(["settings"], (oldData) => ({
      ...oldData,
      [name]: c,
    }));
    await updateSettings(c);
  };

  return (
    <Switch.Root
      disabled={disabled ?? false}
      checked={checked}
      onCheckedChange={(c) => switchHandler(c)}
      className="w-[42px] h-[25px] bg-[#DDDDDD] rounded-full data-[state=checked]:bg-[#CAA0FF] data-[disabled=true]:bg-[#696969]"
    >
      <Switch.Thumb className="block w-[21px] h-[21px] bg-[#9D9D9D] rounded-full transition-all duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px] data-[state=checked]:bg-purple" />
    </Switch.Root>
  );
}
