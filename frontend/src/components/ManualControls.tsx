'use client';

import { useState } from 'react';
import {
  Box,
  Slider,
  Typography,
  Button,
  Paper,
} from '@mui/material';

interface ManualControlsProps {
  onAction: (thrust: number, angle: number) => void;
  disabled?: boolean;
}

export default function ManualControls({ onAction, disabled }: ManualControlsProps) {
  const [thrust, setThrust] = useState(0.5);
  const [angle, setAngle] = useState(0.0);

  const handleApply = () => {
    onAction(thrust, angle);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Manual Controls
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>
          Thrust: {thrust.toFixed(2)}
        </Typography>
        <Slider
          value={thrust}
          onChange={(_, value) => setThrust(value as number)}
          min={0}
          max={1}
          step={0.01}
          disabled={disabled}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>
          Angle: {angle.toFixed(2)}
        </Typography>
        <Slider
          value={angle}
          onChange={(_, value) => setAngle(value as number)}
          min={-1}
          max={1}
          step={0.01}
          disabled={disabled}
        />
      </Box>
      <Button
        variant="contained"
        fullWidth
        onClick={handleApply}
        disabled={disabled}
      >
        Apply Action
      </Button>
    </Paper>
  );
}

