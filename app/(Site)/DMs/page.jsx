"use client";
import fetchData from "@/app/lib/fetchData";
import Link from "next/link";
import Image from "next/image";
import { useAuthContext } from "@/context/authContext";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import BlockLoader from "@/components/svg/blockLoader";

export default function DMs() {
  const { user, accessToken } = useAuthContext();

  const { data, error, isError, isLoading } = useQuery({
    queryKey: [user.uid, "userMessages"],
    queryFn: () => fetchData(`messages/${accessToken}`),
    enabled: !!accessToken,
  });

  if (isError) {
    console.log("failed fetching", error);
  }

  return (
    <>
      {isLoading ? (
        <div className="full-height w-full grid place-items-center">
          <BlockLoader />
        </div>
      ) : (
        <div className="mt-3 md:ml-4 lg:ml-0 px-1 md:px-0">
          <h1 className="font-bold font-mont text-4xl">Messages</h1>
          <div className="mt-6">
            {data?.messages ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.messages.slice(0, 3).map((convo) => {
                  const sentAt = new Date(convo.sentAt);
                  const currentDate = new Date();

                  let content = convo.content;
                  if (content.length === 0) {
                    content = "(image)";
                  }

                  let formattedDistance = "";
                  const minutesDifference = differenceInMinutes(
                    currentDate,
                    sentAt
                  );
                  const hoursDifference = differenceInHours(
                    currentDate,
                    sentAt
                  );
                  const daysDifference = differenceInDays(currentDate, sentAt);
                  const monthsDifference = differenceInMonths(
                    currentDate,
                    sentAt
                  );
                  const yearsDifference = differenceInYears(
                    currentDate,
                    sentAt
                  );

                  if (minutesDifference < 60) {
                    formattedDistance = `${minutesDifference}m`;
                  } else if (hoursDifference < 24) {
                    formattedDistance = `${hoursDifference}h`;
                  } else if (daysDifference < 365) {
                    formattedDistance = `${daysDifference}d`;
                  } else if (monthsDifference < 12) {
                    formattedDistance = `${monthsDifference}m`;
                  } else {
                    formattedDistance = `${yearsDifference}y`;
                  }
                  return (
                    <Link
                      href={`/DMs/${convo.username}?id=${convo.id}`}
                      key={convo.id}
                      className="w-full p-2 bg-grey rounded"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          className="rounded-full w-[50px] h-[50px] object-cover"
                          src={convo.pfpURL}
                          alt="PFP"
                          width={50}
                          height={50}
                        />
                        <div className="flex flex-col w-[80%]">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className=" text-xl text-bold">
                              {convo.username}
                            </h4>
                            <span className="text-sm text-lightwht">
                              {formattedDistance}
                            </span>
                          </div>
                          <span className="w-full whitespace-nowrap overflow-hidden text-ellipsis">
                            {content}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-ful grid place-items-center">
                <span className="text-2xl">No messages</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
