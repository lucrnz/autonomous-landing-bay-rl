import { Button, Container } from "@mui/material";
import { DevModeRedirect } from "@/components/landing/DevModeRedirect";
import { NextLink } from "@/components/Link";
import { env } from "@/env";

export default async function NotFound() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <h4 className="text-4xl font-semibold mb-4">Not Found</h4>
      <p className="mb-4">Could not find requested resource</p>

      <Button component={NextLink} href="/" variant="contained">
        Return Home
      </Button>

      {env.NODE_ENV === "development" && <DevModeRedirect />}
    </Container>
  );
}
