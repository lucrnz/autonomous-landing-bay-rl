import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PYTHON_API_URL: z.url().optional().default("http://localhost:8000"),
  },

  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_BASE_PATH: z
      .string()
      .optional()
      .default("/")
      .refine((v) => v.endsWith("/"), {
        message: "NEXT_PUBLIC_BASE_PATH must end with a slash",
      })
      .refine((v) => v.startsWith("/"), {
        message: "NEXT_PUBLIC_BASE_PATH must start with a slash",
      }),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
