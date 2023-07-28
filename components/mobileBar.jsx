"use client";
import Link from "next/link";
import Image from "next/image";
import fetchData from "@/app/lib/fetchData";
import { useAuthContext } from "@/context/authContext";
import { useEffect, useState } from "react";

export default function MobileBar() {
  const { user } = useAuthContext();
  const [account, setAccount] = useState({});
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await fetchData("User");
        const acc = usersData.find((u) => u.id === user.uid);
        setAccount(acc);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="flex md:hidden justify-between p-2 bg-grey items-center rounded">
        <Link href="/">
      <Image src="/birblogo.png" alt="Logo" width="34" height="25" />
      </Link>
      <div className="flex gap-2 items-center">
        <Link href="/Home">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
              >
                <path
                  d="M7.5 23.75H11.25V16.25H18.75V23.75H22.5V12.5L15 6.875L7.5 12.5V23.75ZM7.5 26.25C6.8125 26.25 6.22375 26.005 5.73375 25.515C5.24375 25.025 4.99917 24.4367 5 23.75V12.5C5 12.1042 5.08875 11.7292 5.26625 11.375C5.44375 11.0208 5.68834 10.7292 6 10.5L13.5 4.875C13.7292 4.70833 13.9688 4.58333 14.2188 4.5C14.4688 4.41667 14.7292 4.375 15 4.375C15.2708 4.375 15.5313 4.41667 15.7813 4.5C16.0313 4.58333 16.2708 4.70833 16.5 4.875L24 10.5C24.3125 10.7292 24.5575 11.0208 24.735 11.375C24.9125 11.7292 25.0008 12.1042 25 12.5V23.75C25 24.4375 24.755 25.0263 24.265 25.5163C23.775 26.0063 23.1867 26.2508 22.5 26.25H16.25V18.75H13.75V26.25H7.5Z"
                  fill="white"
                />
              </svg>
        </Link>
        <Image
          src={account?.pfpURL ?? "/birblogo.png"}
          alt="User Image"
          width="30"
          height="30"
          className="rounded-full"
        />
      </div>
    </div>
  );
}
