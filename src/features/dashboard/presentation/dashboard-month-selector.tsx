"use client";

import { useRouter } from "next/navigation";

export function DashboardMonthSelector({ referenceMonth }: { referenceMonth: string }) {
  const router = useRouter();

  return <label className="grid w-full min-w-0 gap-1 text-sm font-medium sm:w-auto" htmlFor="month">
    Período
    <input className="h-10 min-w-0 max-w-full rounded-md border bg-background px-3 sm:w-44" defaultValue={referenceMonth} id="month" onChange={(event) => {
      const month = event.target.value;
      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) router.push(`/dashboard?month=${month}`);
    }} type="month" />
  </label>;
}