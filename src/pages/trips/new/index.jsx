import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { NavLink, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import SelectStore from '../../../components/SelectStore';
import { useTrips } from '../../../hooks/useTrips';
import { defaultTripForm } from '../../../constants/trips';
import ChecklistPreviewCard from '../details/components/ChecklistPreviewCard';
import BuildChecklistDialog from '../details/components/BuildChecklistDialog';

function buildInitialValues() {
  return {
    ...defaultTripForm,
    planned_for: dayjs(),
    budget: '',
    store_id: '',
    note: ''
  };
}

function validate(values) {
  const nextErrors = {};

  if (!String(values.name || '').trim()) {
    nextErrors.name = 'Trip name is required.';
  }

  if (!values.planned_for || !dayjs(values.planned_for).isValid()) {
    nextErrors.planned_for = 'Planned date is required.';
  }

  if (values.budget === '' || Number(values.budget) < 0) {
    nextErrors.budget = 'Budget must be zero or greater.';
  }

  if (!String(values.store_id || '').trim()) {
    nextErrors.store_id = 'Store is required.';
  }

  return nextErrors;
}

export default function NewTripPage() {
  const navigate = useNavigate();
  const { addTrip, replaceTripChecklist } = useTrips();
  const [values, setValues] = useState(buildInitialValues);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [draftItems, setDraftItems] = useState([]);
  const hasErrors = Object.values(errors).some(Boolean);

  const draftTrip = useMemo(
    () => ({
      id: 'new-trip-draft',
      ...values,
      budget: Number(values.budget || 0),
      planned_for: dayjs(values.planned_for).isValid()
        ? dayjs(values.planned_for).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD'),
      items: draftItems
    }),
    [draftItems, values]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleSaveTrip() {
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setBusy(true);
    try {
      const trip = await addTrip({
        name: values.name.trim(),
        planned_for: dayjs(values.planned_for).format('YYYY-MM-DD'),
        budget: Number(values.budget || 0),
        store_id: values.store_id,
        note: values.note || ''
      });

      await replaceTripChecklist(trip.id, draftItems);
      navigate(`/trips/${trip.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Grocery Trips"
        title="New Trip"
        description="Create the trip details and build its checklist before saving."
        action={
          <Button component={NavLink} to="/trips" variant="contained">
            Back to Trips
          </Button>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">Trip Details</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Trip Name"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        error={Boolean(errors.name)}
                        helperText={errors.name}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <DatePicker
                        sx={{ width: '100%' }}
                        label="Planned For"
                        value={values.planned_for}
                        onChange={(value) => handleChange({ target: { name: 'planned_for', value } })}
                        slotProps={{
                          textField: {
                            required: true,
                            error: Boolean(errors.planned_for),
                            helperText: errors.planned_for
                          }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Budget"
                        name="budget"
                        type="number"
                        value={values.budget}
                        onChange={handleChange}
                        error={Boolean(errors.budget)}
                        helperText={errors.budget}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <SelectStore
                        label="Store"
                        name="store_id"
                        value={values.store_id}
                        onChange={handleChange}
                        helperText={errors.store_id}
                        error={Boolean(errors.store_id)}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Notes"
                        name="note"
                        value={values.note}
                        onChange={handleChange}
                        multiline
                        rows={3}
                      />
                    </Grid>
                  </Grid>
                  {hasErrors ? (
                    <Alert severity="error">Please fix the form errors before saving the trip.</Alert>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>

            <ChecklistPreviewCard
              items={draftItems}
              onBuildChecklist={() => setChecklistDialogOpen(true)}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Save Trip</Typography>
                <Typography variant="body2" color="text.secondary">
                  Saving will create the trip and attach the checklist items you built here.
                </Typography>
                <Button variant="outlined" onClick={() => setChecklistDialogOpen(true)} disabled={busy}>
                  {draftItems.length ? 'Edit Checklist' : 'Build Checklist'}
                </Button>
                <Button variant="contained" onClick={handleSaveTrip} disabled={busy}>
                  {busy ? 'Saving...' : 'Save Trip'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <BuildChecklistDialog
        open={checklistDialogOpen}
        trip={draftTrip}
        busy={busy}
        onClose={() => setChecklistDialogOpen(false)}
        onSave={async (items) => {
          setDraftItems(items);
          setChecklistDialogOpen(false);
        }}
      />
    </>
  );
}
