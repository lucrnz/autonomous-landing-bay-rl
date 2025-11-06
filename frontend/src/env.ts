import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PYTHON_API_URL: z.url().optional().default("http://localhost:8000"),
  },

  clientPrefix: "PUBLIC_",
  client: {},

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
