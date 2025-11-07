import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PYTHON_API_URL: z.url().optional().default("http://localhost:8000"),
    TURNSTILE_SECRET_KEY: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "production"])
      .optional()
      .default("development"),
  },

  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_BASE_PATH: z
      .string()
      .optional()
      .default("/landing-bay-rl/")
      .refine((v) => v.endsWith("/"), {
        message: "NEXT_PUBLIC_BASE_PATH must end with a slash",
      })
      .refine((v) => v.startsWith("/"), {
        message: "NEXT_PUBLIC_BASE_PATH must start with a slash",
      }),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  },

  runtimeEnv: {
    PYTHON_API_URL: process.env.PYTHON_API_URL,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  },
  emptyStringAsUndefined: true,
});
