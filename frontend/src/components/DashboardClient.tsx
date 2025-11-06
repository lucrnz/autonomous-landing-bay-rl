"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSimulation } from "@/hooks/useSimulation";
import SimulationCanvas from "@/components/SimulationCanvas";
import ManualControls from "@/components/ManualControls";
import EpisodeHistory from "@/components/EpisodeHistory";
import { logoutAction } from "@/lib/actions/auth";
import { User } from "@/lib/schemas";
import {
  Container,
  Box,
  Button,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Alert,
  Grid,
} from "@mui/material";
import { PlayArrow, Stop, Logout } from "@mui/icons-material";

interface DashboardClientProps {
  userPromise: Promise<User>;
}

export default function DashboardClient({ userPromise }: DashboardClientProps) {
  const user = use(userPromise);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { state, isConnected, mode, result, start, sendAction, stop } =
    useSimulation(() => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
    });
  const [selectedMode, setSelectedMode] = useState<"auto" | "train" | "manual">(
    "auto"
  );

  const handleStart = () => {
    console.log("handleStart", selectedMode);
    start(selectedMode);
  };

  const handleStop = () => {
    stop();
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push("/auth/signin");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Dashboard</Typography>
        <Box>
          <Typography variant="body2" sx={{ mr: 2, display: "inline" }}>
            {user.email}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ mb: 2 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Simulation Mode</FormLabel>
                <RadioGroup
                  row
                  value={selectedMode}
                  onChange={(e) =>
                    setSelectedMode(
                      e.target.value as "auto" | "train" | "manual"
                    )
                  }
                >
                  <FormControlLabel
                    value="auto"
                    control={<Radio />}
                    label="Auto"
                  />
                  <FormControlLabel
                    value="train"
                    control={<Radio />}
                    label="Train"
                  />
                  <FormControlLabel
                    value="manual"
                    control={<Radio />}
                    label="Manual"
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleStart}
                disabled={isConnected}
              >
                Start
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={handleStop}
                disabled={!isConnected}
              >
                Stop
              </Button>
              {isConnected && (
                <Typography variant="body2" sx={{ alignSelf: "center" }}>
                  Status: Connected ({mode})
                </Typography>
              )}
            </Box>

            {result && (
              <Alert
                severity={result.success ? "success" : "error"}
                sx={{ mt: 2 }}
              >
                {result.success ? "Landing successful!" : "Landing failed!"}
                <br />
                Fuel Used: {result.fuel_used.toFixed(2)}
                <br />
                Landing Accuracy: {(result.landing_accuracy * 100).toFixed(1)}%
              </Alert>
            )}
          </Paper>

          <SimulationCanvas state={state} />

          {mode === "manual" && (
            <Box sx={{ mt: 2 }}>
              <ManualControls onAction={sendAction} disabled={!isConnected} />
            </Box>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <EpisodeHistory />
        </Grid>
      </Grid>
    </Container>
  );
}
