"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { User, userSchema } from "../schemas";
import { env } from "@/env";

export async function fetchUser(): Promise<User> {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt_token")?.value;

  if (!token) {
    redirect("/auth/signin");
  }

  let response: Response | null = null;

  try {
    // Call Python backend directly with token as Authorization header
    response = await fetch(`${env.PYTHON_API_URL}/auth/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    redirect("/auth/signin");
  }

  if (!response.ok) {
    redirect("/auth/signin");
  }

  const rawData = await response.json();
  const parsed = userSchema.safeParse(rawData);

  if (!parsed.success) {
    console.error("User response error:", parsed.error);
    redirect("/auth/signin");
  }

  return parsed.data;
}
