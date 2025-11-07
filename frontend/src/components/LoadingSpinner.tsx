import { Box, CircularProgress } from "@mui/material";

export default function LoadingSpinner() {
  return (
    <Box className="flex justify-center items-center min-h-screen">
      <CircularProgress />
    </Box>
  );
}
