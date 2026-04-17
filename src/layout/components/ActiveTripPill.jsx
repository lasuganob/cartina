import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Stack, ButtonBase } from '@mui/material';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTrips } from '../../hooks/useTrips';
import { formatCurrency } from '../../utils/formatCurrency';
import { getShoppingSessionKey } from '../../lib/db';


/**
 * A floating "Global Status Pill" that appears when a shopping trip is in progress.
 * Provides live updates and quick navigation back to the shopping page.
 */
export default function ActiveTripPill() {
  const { trips } = useTrips();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [now, setNow] = useState(Date.now());

  // Find the first active trip
  const activeTrip = useMemo(() => 
    trips.find(t => t.status === 'in_progress'), 
  [trips]);

  // Read session state from localStorage to check if paused
  const sessionInfo = useMemo(() => {
    if (!activeTrip) return null;
    try {
      const data = localStorage.getItem(getShoppingSessionKey(activeTrip.id));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, [activeTrip, now]); // Re-calculate when 'now' changes to keep sync, or we can use a simpler approach

  const isRunning = sessionInfo ? !!sessionInfo.isRunning : true;

  // Hide if no active trip OR if we are already on the shopping page
  const isShoppingPage = pathname.includes('/shopping');

  // Update timer every second only if running
  useEffect(() => {
    if (!activeTrip || isShoppingPage || !isRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeTrip, isShoppingPage, isRunning]);

  if (!activeTrip || isShoppingPage) return null;

  // Calculate stats
  const totalItems = activeTrip.items.length;
  const checkedItems = activeTrip.items.filter(i => i.is_purchased).length;
  const subtotal = activeTrip.items.reduce(
    (sum, i) => sum + (Number(i.actual_price || 0) * Number(i.quantity || 1)), 
    0
  );
  
  // Progress for the background fill
  const progressPercent = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  // Calculate elapsed time (same logic as shopping page)
  const elapsedMs = Math.max(0, (activeTrip.elapsed_ms || 0) + (activeTrip.started_at ? (now - new Date(activeTrip.started_at).getTime()) : 0));
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = String(totalSeconds % 60).padStart(2, '0');
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${s}`
      : `${m}:${s}`;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 80, // Sit above bottom navigation
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        maxWidth: 400,
        height: 64,
        zIndex: 1100,
        bgcolor: '#1a2e24', // Deep dark green
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      {/* Progress Background Fill */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${progressPercent}%`,
          bgcolor: 'rgba(74, 101, 85, 0.4)', // Slightly lighter forest green
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 0
        }}
      />

      {/* Main Content Area */}
      <ButtonBase
        onClick={() => navigate(`/trips/${activeTrip.id}/shopping`)}
        sx={{
          flex: 1,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          textAlign: 'left',
          zIndex: 1
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
          {/* Icon with Live Indicator */}
          <Box sx={{ position: 'relative' }}>
            <Box 
              sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 2, 
                bgcolor: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShoppingCartRoundedIcon sx={{ color: '#81c784', fontSize: 20 }} />
            </Box>
            <Box 
              sx={{ 
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#4caf50',
                border: '2px solid #1a2e24',
                animation: 'pulse 2s infinite'
              }}
            />
          </Box>

          {/* Texts */}
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight={700} color="#fff">
                {activeTrip.name || 'ShoppingTrip'}
              </Typography>
              <Box 
                sx={{ 
                  bgcolor: isRunning ? 'rgba(129, 199, 132, 0.1)' : 'rgba(255, 183, 77, 0.1)', 
                  px: 0.8, 
                  py: 0.2, 
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography sx={{ 
                  fontSize: '9px', 
                  fontWeight: 900, 
                  color: isRunning ? '#81c784' : '#ffb74d' 
                }}>
                  {isRunning ? 'LIVE' : 'PAUSED'}
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                {checkedItems}/{totalItems} items
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>•</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                {formatTime(elapsedMs)}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>•</Typography>
              <Typography sx={{ color: '#81c784', fontSize: '11px', fontWeight: 700 }}>
                {formatCurrency(subtotal)}
              </Typography>
            </Stack>
          </Box>

          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 700 }}>Resume</Typography>
            <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
          </Stack>
        </Stack>
      </ButtonBase>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
          }
        `}
      </style>
    </Box>
  );
}
