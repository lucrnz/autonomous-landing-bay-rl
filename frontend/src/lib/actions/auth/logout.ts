"use server";

import { cookies } from "next/headers";

export async function logoutAction() {
  try {
    // Delete cookie
    const cookieStore = await cookies();
    cookieStore.delete("jwt_token");

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}
