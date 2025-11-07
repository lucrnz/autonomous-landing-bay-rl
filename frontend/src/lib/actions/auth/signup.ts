"use server";

import { env } from "@/env";
import { verifyTurnstileToken } from "@/lib/catpcha/verify";

export async function signupAction(
  email: string,
  password: string,
  turnstileToken: string
) {
  if (!(await verifyTurnstileToken(turnstileToken))) {
    return {
      success: false,
      error: "Invalid captcha verification",
    };
  }

  try {
    // Call Next.js API proxy route which will verify Turnstile and forward to backend
    const response = await fetch(`${env.PYTHON_API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      // Extract detail from FastAPI error response
      const errorDetail = (data as { detail?: string | { msg: string }[] })
        .detail;
      let errorMessage = "Sign up failed";

      if (typeof errorDetail === "string") {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail)) {
        // Pydantic validation errors
        errorMessage = errorDetail.map((err) => err.msg).join(", ");
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}
