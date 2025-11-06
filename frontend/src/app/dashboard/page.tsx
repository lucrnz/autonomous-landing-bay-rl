import { Suspense } from "react";
import { fetchUser } from "@/lib/api";
import DashboardClient from "@/components/DashboardClient";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardPage() {
  const userPromise = fetchUser();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardClient userPromise={userPromise} />
    </Suspense>
  );
}
