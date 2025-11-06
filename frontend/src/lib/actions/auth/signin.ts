"use server";

import { cookies } from "next/headers";
import { z } from "zod";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

const responseSchema = z.object({
  token: z.string(),
});

export async function signinAction(email: string, password: string) {
  try {
    // Forward request to Python backend
    const response = await fetch(`${PYTHON_API_URL}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const rawData = await response.json();

    if (!response.ok) {
      // Extract detail from FastAPI error response
      const errorDetail = rawData.detail || rawData.error;
      return {
        success: false,
        error: typeof errorDetail === "string" ? errorDetail : "Sign in failed",
      };
    }

    const parsed = responseSchema.safeParse(rawData);

    if (!parsed.success) {
      console.error("Sign in error:", parsed.error);
      return {
        success: false,
        error: "Internal server error",
      };
    }

    const { token } = parsed.data;

    const cookieStore = await cookies();
    cookieStore.set("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}
