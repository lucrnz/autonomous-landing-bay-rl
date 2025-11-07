"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupAction } from "@/lib/actions/auth";
import { env } from "@/env";
import { passwordSchema } from "@/lib/schemas/password";
import {
  Container,
  Paper,
  TextField,
  Button,
  Link,
  Alert,
} from "@mui/material";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import { NextLink } from "@/components/Link";
import { Turnstile } from "next-turnstile";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordFieldInvalid, setPasswordFieldInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
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

      // Check if Turnstile token is present
      if (!turnstileToken && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
        setError("Please complete the captcha verification");
        setLoading(false);
        return;
      }

      const result = await signupAction(email, password, turnstileToken ?? "");
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
      <div className="min-h-screen flex items-center justify-center">
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

            {env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <div className="mx-3 flex justify-center">
                <Turnstile
                  siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
                  onVerify={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                  theme="dark"
                />
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="mt-3 mb-4"
              disabled={
                loading ||
                (!turnstileToken && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
              }
              startIcon={
                loading ? (
                  <DonutLargeRoundedIcon className="animate-spin delay" />
                ) : null
              }
            >
              Continue
            </Button>
            <div className="flex flex-col items-center justify-center opacity-75 hover:opacity-100 transition-all">
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
            </div>
          </form>
        </Paper>
      </div>
    </Container>
  );
}
