"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupAction } from "@/lib/actions/auth";
import { passwordSchema } from "@/lib/schemas/password";
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

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordFieldInvalid, setPasswordFieldInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPasswordFieldInvalid(false);
    setLoading(true);

    try {
      // Validate password with Zod
      const passwordValidation = passwordSchema.safeParse(password);
      if (!passwordValidation.success) {
        setPasswordFieldInvalid(true);
        setLoading(false);
        return;
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      const result = await signupAction(email, password);
      if (result.success) {
        router.push(
          "/auth/signin?message=Account created successfully, please sign in"
        );
      } else {
        setError(result.error || "Sign up failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box className="min-h-screen flex items-center justify-center">
        <Paper className="p-4 w-full">
          <h4 className="text-4xl font-display font-semibold mb-2">
            Create your account
          </h4>
          <p className="text-sm text-gray-300 mb-3">
            Enter your email and password to create your account
          </p>

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
              autoComplete="new-password"
              helperText="At least 8 characters with uppercase, lowercase, number, and special character"
              error={passwordFieldInvalid}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="new-password"
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
                {"Already have an account?"}
                <Link
                  component={NextLink}
                  href="/auth/signin"
                  underline="hover"
                >
                  Sign in
                </Link>
              </div>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
