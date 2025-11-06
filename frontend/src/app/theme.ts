"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: [
      "'Exo 2 Variable'",
      "'Inter'",
      "-apple-system",
      "'BlinkMacSystemFont'",
      '"Segoe UI"',
      "'Roboto'",
      "'Helvetica Neue'",
      "'Arial'",
      "sans-serif",
      "'Apple Color Emoji'",
      "'Segoe UI Emoji'",
      "'Segoe UI Symbol'",
    ].join(","),
  },
});
