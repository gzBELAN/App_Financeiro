"use client";

import { useRouter } from "next/navigation";

export function DashboardMonthSelector({ referenceMonth }: { referenceMonth: string }) {
  const router = useRouter();

  return <label className="grid gap-1 text-sm font-medium" htmlFor="month">
    Período
    <input className="h-10 rounded-md border bg-background px-3" defaultValue={referenceMonth} id="month" onChange={(event) => {
      const month = event.target.value;
      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) router.push(`/dashboard?month=${month}`);
    }} type="month" />
  </label>;
}