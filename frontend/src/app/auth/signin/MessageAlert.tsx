"use client";

import { useSearchParams } from "next/navigation";
import { Alert } from "@mui/material";

export default function MessageAlert() {
  const searchParams = useSearchParams();
  const message = searchParams?.get("message") ?? "";

  if (message.length === 0) {
    return null;
  }

  return (
    <Alert severity="success" sx={{ mb: 2 }}>
      {message}
    </Alert>
  );
}

