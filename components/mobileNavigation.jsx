"use client";
import Link from "next/link";
import Image from "next/image";
import fetchData from "@/app/lib/fetchData";
import { useAuthContext } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import HomeIcon from "./svg/navigationIcons/homeIcon";
import { usePathname } from "next/navigation";
import MessageIcon from "./svg/navigationIcons/messageIcon";
import SettingsIcon from "./svg/navigationIcons/settingsIcon";
export default function MobileNavigation() {
  const { user } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const {
    data: _user,
    error,
    status,
  } = useQuery({
    queryKey: [user?.uid, "userOverview"],
    queryFn: () => fetchData(`UserOverview/${user?.uid}`),
  });

  if (status === "error") {
    console.error(error);
  }

  if (status === "success" && !_user) {
    router.push("/SignIn");
  }

  return (
    <div className="md:hidden bg-[#000] border-t border-t-lightwht flex justify-between fixed bottom-0 w-full px-4 z-10">
      <Link href="/Home" className="p-3">
        <HomeIcon active={pathname === "/Home"} />
      </Link>
      <Link href="/DMs" className="p-3">
        <MessageIcon active={pathname.startsWith("/DMs")} />
      </Link>
      <Link href="/settings" className="p-3">
        <SettingsIcon active={pathname === "/settings"} />
      </Link>
      <Link href={`/profile/${_user?.username}`} className="p-3">
        <div className="rounded-full h-6 w-6 bg-grey">
          {_user ? (
            <Image
              width={24}
              height={24}
              src={_user?.pfpURL}
              alt="You"
              className={`rounded-full border-white ${
                pathname === "/profile/" + _user?.username
                  ? "border-1"
                  : "border-0"
              }`}
            />
          ) : (
            ""
          )}
        </div>
      </Link>
    </div>
  );
}
