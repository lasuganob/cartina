import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import { defaultTripForm } from '../../../constants/trips';

function validate(values) {
  const nextErrors = {};

  if (!values.name.trim()) {
    nextErrors.name = 'Trip name is required.';
  }

  if (!values.planned_for) {
    nextErrors.planned_for = 'Planned date is required.';
  }

  if (values.budget && Number(values.budget) < 0) {
    nextErrors.budget = 'Budget cannot be negative.';
  }

  return nextErrors;
}

export default function AddTripSection({ onSubmit }) {
  const [values, setValues] = useState({
    ...defaultTripForm,
    planned_for: dayjs().format('YYYY-MM-DD')
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setIsSubmitting(true);
    await onSubmit(values);
    setValues({
      ...defaultTripForm,
      planned_for: dayjs().format('YYYY-MM-DD')
    });
    setIsSubmitting(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Add Trip
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          New trips are written to IndexedDB immediately and synced to Google Apps Script later.
        </Typography>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            label="Trip Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={Boolean(errors.name)}
            helperText={errors.name}
            required
          />
          <TextField
            label="Budget"
            name="budget"
            type="number"
            value={values.budget}
            onChange={handleChange}
            error={Boolean(errors.budget)}
            helperText={errors.budget || 'Optional. Leave empty for zero.'}
          />
          <TextField
            label="Planned For"
            name="planned_for"
            type="date"
            value={values.planned_for}
            onChange={handleChange}
            error={Boolean(errors.planned_for)}
            helperText={errors.planned_for}
            InputLabelProps={{ shrink: true }}
            required
          />
          {Object.keys(errors).length > 0 ? (
            <Alert severity="error">Please fix the form errors before saving.</Alert>
          ) : null}
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Trip'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
