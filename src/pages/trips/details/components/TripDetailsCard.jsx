import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Stack,
  TextField,
  Typography,
  Collapse
} from '@mui/material';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SelectStore from '../../../../components/SelectStore';

import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';

function buildDraft(trip) {
  return {
    name: trip.name || '',
    planned_for: dayjs(trip.planned_for) || '',
    budget: String(trip.budget ?? ''),
    store_id: trip.store_id || '',
    note: trip.note || ''
  };
}

export default function TripDetailsCard({ trip, saving, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => buildDraft(trip));
  const previousTripId = useRef(trip.id);

  useEffect(() => {
    if (previousTripId.current !== trip.id) {
      previousTripId.current = trip.id;
      setDraft(buildDraft(trip));
      setIsEditing(false);
      return;
    }

    if (!isEditing) {
      setDraft(buildDraft(trip));
    }
  }, [isEditing, trip]);

  function handleChange(event) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  }

  async function handleSave() {
    await onSave({
      ...draft,
      planned_for: dayjs(draft.planned_for).format('YYYY-MM-DD'),
      budget: Number(draft.budget || 0)
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setDraft(buildDraft(trip));
    setIsEditing(false);
  }
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight={700}>Trip Details</Typography>
          {trip.status === "completed" || trip.status === "archived" ? null : (
            <Stack direction="row" spacing={1}>
              {isEditing ? (
                <>
                  <Button variant="outlined" onClick={handleCancel} disabled={saving} size="small" sx={{ borderRadius: 2, py: 0.5 }}>
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={handleSave} disabled={saving} size="small" sx={{ borderRadius: 2, py: 0.5 }}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button variant="contained" onClick={() => setIsEditing(true)} size="small" sx={{ borderRadius: 2, py: 0.5 }}>
                  Edit
                </Button>
              )}
            </Stack>
          )}
        </Stack>

        {!isEditing && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 0 }}
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
            sx={{
              flexWrap: 'wrap',
              alignItems: { xs: 'flex-start', sm: 'center' },
              rowGap: 1
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, pr: { sm: 1.5 } }}>
              <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600}>
                {trip.planned_for ? dayjs(trip.planned_for).format('MMM DD, YYYY') : 'Not set'}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, px: { sm: 1.5 } }}>
              <AccountBalanceWalletRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600}>
                PHP {trip.budget ?? 0}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, pl: { sm: 1.5 } }}>
              <StorefrontRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600} noWrap>
                {trip.store?.name || 'Not set'}
              </Typography>
            </Stack>
          </Stack>
        )}
        
        <Collapse in={isEditing}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 12 }}>
              <TextField
                fullWidth
                label="Trip Name"
                name="name"
                value={draft.name}
                onChange={handleChange}
                InputProps={{ readOnly: !isEditing }}
                required={true}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <DatePicker
                sx={{ width: "100%" }}
                label="Planned For"
                name="planned_for"
                format="MMM DD, YYYY"
                value={dayjs(draft.planned_for)}
                onChange={(value) => handleChange({ target: { name: 'planned_for', value } })}
                readOnly={!isEditing}
                slotProps={{textField: { required: true, size: "small" }}}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Budget"
                name="budget"
                type="number"
                value={draft.budget}
                onChange={handleChange}
                InputProps={{ readOnly: !isEditing }}
                required={true}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <SelectStore
                label="Store"
                name="store_id"
                value={draft.store_id}
                onChange={handleChange}
                readOnly={!isEditing}
                required={true}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 12 }}>
              <TextField
                fullWidth
                label="Notes"
                name="note"
                value={draft.note}
                onChange={handleChange}
                InputProps={{ readOnly: !isEditing }}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
}
