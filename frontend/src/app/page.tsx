import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/api";

export default async function Home() {
  // Check if user is authenticated and redirects to signin if not
  await fetchUser();

  // If user is fetched, redirect to dashboard
  redirect("/dashboard");
}
