"use client";
import Image from "next/image";
import Link from "next/link";
import fetchData from "@/app/lib/fetchData";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/authContext";
import { getAuth, signOut } from "firebase/auth";
import { initFirebase } from "@/firebase/app";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Sidebar() {
  const [account, setAccount] = useState({});
  const { user } = useAuthContext();
  const auth = getAuth();
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await fetchData("User");
        const acc = usersData.find((u) => u.id === user.uid);
        if (acc) {
          setAccount(acc);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="hidden md:flex h-full bg-grey w-48 flex-col items-center justify-between py-4 rounded">
      <div className="flex flex-col items-center">
        <Link href={"/"}>
          <div className="flex items-center mb-8 gap-2">
            <Image src="/birblogo.png" alt="Logo" width="34" height="25" />
            <h3 className="text-3xl">Titter</h3>
          </div>
        </Link>
        <Link href="/Home">
          <div className="flex items-center gap-2">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 30 30"
                fill="none"
              >
                <path
                  d="M7.5 23.75H11.25V16.25H18.75V23.75H22.5V12.5L15 6.875L7.5 12.5V23.75ZM7.5 26.25C6.8125 26.25 6.22375 26.005 5.73375 25.515C5.24375 25.025 4.99917 24.4367 5 23.75V12.5C5 12.1042 5.08875 11.7292 5.26625 11.375C5.44375 11.0208 5.68834 10.7292 6 10.5L13.5 4.875C13.7292 4.70833 13.9688 4.58333 14.2188 4.5C14.4688 4.41667 14.7292 4.375 15 4.375C15.2708 4.375 15.5313 4.41667 15.7813 4.5C16.0313 4.58333 16.2708 4.70833 16.5 4.875L24 10.5C24.3125 10.7292 24.5575 11.0208 24.735 11.375C24.9125 11.7292 25.0008 12.1042 25 12.5V23.75C25 24.4375 24.755 25.0263 24.265 25.5163C23.775 26.0063 23.1867 26.2508 22.5 26.25H16.25V18.75H13.75V26.25H7.5Z"
                  fill="white"
                />
              </svg>
            </div>
            <span className=" text-2xl font-mont font-bold">Home</span>
          </div>
        </Link>
      </div>
      <div className="flex gap-2">
        {account.pfpURL ? (
          <Image
            src={account?.pfpURL}
            alt="User Image"
            width="30"
            height="30"
            className="rounded-full"
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            viewBox="0 0 16 16"
          >
            <path
              fill="currentColor"
              d="M16 7.992C16 3.58 12.416 0 8 0S0 3.58 0 7.992c0 2.43 1.104 4.62 2.832 6.09c.016.016.032.016.032.032c.144.112.288.224.448.336c.08.048.144.111.224.175A7.98 7.98 0 0 0 8.016 16a7.98 7.98 0 0 0 4.48-1.375c.08-.048.144-.111.224-.16c.144-.111.304-.223.448-.335c.016-.016.032-.016.032-.032c1.696-1.487 2.8-3.676 2.8-6.106zm-8 7.001c-1.504 0-2.88-.48-4.016-1.279c.016-.128.048-.255.08-.383a4.17 4.17 0 0 1 .416-.991c.176-.304.384-.576.64-.816c.24-.24.528-.463.816-.639c.304-.176.624-.304.976-.4A4.15 4.15 0 0 1 8 10.342a4.185 4.185 0 0 1 2.928 1.166c.368.368.656.8.864 1.295c.112.288.192.592.24.911A7.03 7.03 0 0 1 8 14.993zm-2.448-7.4a2.49 2.49 0 0 1-.208-1.024c0-.351.064-.703.208-1.023c.144-.32.336-.607.576-.847c.24-.24.528-.431.848-.575c.32-.144.672-.208 1.024-.208c.368 0 .704.064 1.024.208c.32.144.608.336.848.575c.24.24.432.528.576.847c.144.32.208.672.208 1.023c0 .368-.064.704-.208 1.023a2.84 2.84 0 0 1-.576.848a2.84 2.84 0 0 1-.848.575a2.715 2.715 0 0 1-2.064 0a2.84 2.84 0 0 1-.848-.575a2.526 2.526 0 0 1-.56-.848zm7.424 5.306c0-.032-.016-.048-.016-.08a5.22 5.22 0 0 0-.688-1.406a4.883 4.883 0 0 0-1.088-1.135a5.207 5.207 0 0 0-1.04-.608a2.82 2.82 0 0 0 .464-.383a4.2 4.2 0 0 0 .624-.784a3.624 3.624 0 0 0 .528-1.934a3.71 3.71 0 0 0-.288-1.47a3.799 3.799 0 0 0-.816-1.199a3.845 3.845 0 0 0-1.2-.8a3.72 3.72 0 0 0-1.472-.287a3.72 3.72 0 0 0-1.472.288a3.631 3.631 0 0 0-1.2.815a3.84 3.84 0 0 0-.8 1.199a3.71 3.71 0 0 0-.288 1.47c0 .352.048.688.144 1.007c.096.336.224.64.4.927c.16.288.384.544.624.784c.144.144.304.271.48.383a5.12 5.12 0 0 0-1.04.624c-.416.32-.784.703-1.088 1.119a4.999 4.999 0 0 0-.688 1.406c-.016.032-.016.064-.016.08C1.776 11.636.992 9.91.992 7.992C.992 4.14 4.144.991 8 .991s7.008 3.149 7.008 7.001a6.96 6.96 0 0 1-2.032 4.907z"
            ></path>
          </svg>
        )}
        <h2 className="font-mont text-xl">
          {account?.username || <Skeleton/>}
        </h2>
        <svg
          onClick={() => handleSignOut()}
          className="cursor-pointer"
          xmlns="http://www.w3.org/2000/svg"
          width="25"
          height="25"
          viewBox="0 0 25 25"
          fill="none"
        >
          <path
            d="M5.20833 5.20833H12.5V3.125H5.20833C4.0625 3.125 3.125 4.0625 3.125 5.20833V19.7917C3.125 20.9375 4.0625 21.875 5.20833 21.875H12.5V19.7917H5.20833V5.20833ZM21.875 12.5L17.7083 8.33333V11.4583H9.375V13.5417H17.7083V16.6667L21.875 12.5Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  );
}
