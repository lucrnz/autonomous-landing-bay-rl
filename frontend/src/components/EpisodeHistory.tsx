"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Alert,
} from "@mui/material";
import { fetchEpisodes } from "@/lib/api";

interface Episode {
  id: number;
  timestamp: string;
  success: boolean;
  fuel_used: number;
  landing_accuracy: number;
}

export default function EpisodeHistory() {
  const {
    data: episodes = [],
    isLoading,
    error,
  } = useQuery<Episode[]>({
    queryKey: ["episodes"],
    queryFn: fetchEpisodes,
  });

  if (isLoading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>Loading episodes...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Episode History
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error ? error.message : "Failed to fetch episodes"}
        </Alert>
      )}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Success</TableCell>
              <TableCell align="right">Fuel Used</TableCell>
              <TableCell align="right">Landing Accuracy</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {episodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No episodes yet
                </TableCell>
              </TableRow>
            ) : (
              episodes.map((episode) => (
                <TableRow key={episode.id}>
                  <TableCell>
                    {new Date(episode.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={episode.success ? "Success" : "Failed"}
                      color={episode.success ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {episode.fuel_used.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {(episode.landing_accuracy * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
