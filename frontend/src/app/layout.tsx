import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";
import { QueryProvider } from "@/components/QueryProvider";
import StarsBackground from "@/components/StarsBackground";
import "@fontsource-variable/exo-2";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autonomous Landing Bay",
  description: "RL Environment for Autonomous Rocket Landing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </head>
        <body>
          <AppRouterCacheProvider>
            <StarsBackground />
            <ThemeProvider theme={theme}>
              <CssBaseline />
              {children}
            </ThemeProvider>
          </AppRouterCacheProvider>
        </body>
      </html>
    </QueryProvider>
  );
}
