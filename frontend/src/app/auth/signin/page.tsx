"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { signinAction } from "@/lib/actions/auth";
import MessageAlert from "./MessageAlert";
import {
  Container,
  Paper,
  TextField,
  Button,
  Link,
  Box,
  Alert,
} from "@mui/material";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import { NextLink } from "@/components/Link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signinAction(email, password);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Sign in failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box className="min-h-screen flex items-center justify-center">
        <Paper className="p-4 w-full">
          <h4 className="text-4xl font-display font-semibold mb-2">
            Welcome Back
          </h4>
          <p className="text-sm text-gray-300 mb-3">
            Enter your email and password to sign in
          </p>

          <Suspense fallback={null}>
            <MessageAlert />
          </Suspense>

          {error && (
            <Alert severity="error" className="mb-2">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="mt-3 mb-4"
              disabled={loading}
              startIcon={
                loading ? (
                  <DonutLargeRoundedIcon className="animate-spin delay" />
                ) : null
              }
            >
              Continue
            </Button>
            <Box className="flex flex-col items-center justify-center opacity-75 hover:opacity-100 transition-all">
              <div className="text-center flex flex-row items-center gap-2">
                {"Don't have an account? "}
                <Link
                  component={NextLink}
                  href="/auth/signup"
                  underline="hover"
                >
                  Sign up
                </Link>
              </div>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
