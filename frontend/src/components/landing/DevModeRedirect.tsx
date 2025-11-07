"use client";

import { useLayoutEffect } from "react";
import { redirect } from "next/navigation";

export const DevModeRedirect = () => {
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    setTimeout(() => {
      if (window.location.pathname === "/") {
        console.log("Redirecting to base path...");
        redirect("/");
      }
    }, 500);
  }, []);

  return null;
};
