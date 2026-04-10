import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SelectStore from '../../../../components/SelectStore';

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
          <Typography variant="h6">Trip Details</Typography>
          <Stack direction="row" spacing={1}>
            {isEditing ? (
              <>
                <Button variant="outlined" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button variant="contained" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </Stack>
        </Stack>

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
            />
          </Grid>
          <Grid size={{ xs: 5 }}>
            <DatePicker
              sx={{ width: "100%" }}
              label="Planned For"
              name="planned_for"
              format="MMM DD, YYYY"
              value={dayjs(draft.planned_for)}
              onChange={(value) => handleChange({ target: { name: 'planned_for', value } })}
              readOnly={!isEditing}
              slotProps={{textField: { required: true }}}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <TextField
              fullWidth
              label="Budget"
              name="budget"
              type="number"
              value={draft.budget}
              onChange={handleChange}
              InputProps={{ readOnly: !isEditing }}
              required={true}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <SelectStore
              label="Store"
              name="store_id"
              value={draft.store_id}
              onChange={handleChange}
              readOnly={!isEditing}
              required={true}
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
      </CardContent>
    </Card>
  );
}
