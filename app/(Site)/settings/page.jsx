"use client";
import fetchData from "@/app/lib/fetchData";
import ToggleSwitch from "@/components/switches/ToggleSwitch";
import BlockLoader from "@/components/svg/blockLoader";
import { useAuthContext } from "@/context/authContext";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import PermissionSwitch from "@/components/switches/permissionSwitch";

export default function Settings() {
  const { user } = useAuthContext();
  const [NotificationEnabled, setNotificationEnabled] = useState(false);

  const {
    data: settingsData,
    status,
    error,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchData(`settings/${user.uid}`),
  });

  useEffect(() => {
    if (
      Notification.permission === "granted" &&
      settingsData?.enableNotifications
    ) {
      setNotificationEnabled(true);
    } else {
      setNotificationEnabled(false);
    }
  }, [Notification.permission, settingsData?.enableNotifications]);

  if (status === "loading") {
    return (
      <div className="h-[100svh] w-full grid place-items-center">
        <BlockLoader />
      </div>
    );
  }

  if (status === "error") {
    console.log("error fetching settings", error);
    alert("Error fetching settings");
  }

  return (
    <div className="mt-2 px-1 md:px-0">
      <h1 className="font-bold font-mont text-4xl">Settings</h1>
      <div className=" border-y border-y-grey py-3 mt-4">
        <h2 className="font-bold text-xl pb-1">Notifications</h2>
        <div>
          <div className="flex justify-between items-center">
            <span>Enable push notifications</span>
            <PermissionSwitch
              enabled={NotificationEnabled}
              setEnabled={setNotificationEnabled}
            />
          </div>
          <p className="text-sm text-lightwht">
            Receive push notification on your device when you are not on Titter.
            This setting is shared among all logged in devices.
          </p>
        </div>
        <div className=" mt-4 ">
          <div className="flex justify-between items-center pb-3">
            <span>Direct Messages</span>
            <ToggleSwitch
              disabled={!NotificationEnabled}
              checked={settingsData?.notifyDMs}
              name={"notifyDMs"}
            />
          </div>
          <div className="flex justify-between items-center pb-3">
            <span>Likes</span>
            <ToggleSwitch
              disabled={!NotificationEnabled}
              checked={settingsData?.notifyLike}
              name={"notifyLike"}
            />
          </div>
          <div className="flex justify-between items-center pb-3">
            <span>Replies</span>
            <ToggleSwitch
              disabled={!NotificationEnabled}
              checked={settingsData?.notifyReplies}
              name={"notifyReplies"}
            />
          </div>
          <div className="flex justify-between items-center">
            <span>New Followers</span>
            <ToggleSwitch
              disabled={!NotificationEnabled}
              checked={settingsData?.notifyFollow}
              name={"notifyFollow"}
            />
          </div>
        </div>
      </div>
      <div className="py-3">
        <h2 className="font-bold text-xl pb-1">Messages</h2>
        <div>
          <div className="flex justify-between items-center">
            <span>Allow direct messages</span>
            <ToggleSwitch
              disabled={false}
              checked={settingsData?.allowDMs}
              name={"allowDMs"}
            />
          </div>
          <p className="text-sm text-lightwht">
            People you follow will always be able to message you.
          </p>
        </div>
      </div>
    </div>
  );
}
