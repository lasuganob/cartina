import { MenuItem, TextField } from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

/**
 * A standard category selector component that can either use provided categories
 * or fetch them automatically from the local database.
 */
export default function CategorySelector({
  value,
  onChange,
  disabled,
  error,
  helperText,
  label = "Category",
  name = "category_id",
  required = true,
  categories: providedCategories,
  size = "small",
  fullWidth = true
}) {
  const fetchedCategories = useLiveQuery(
    () => db.categories.orderBy('name').toArray(),
    []
  );

  const categories = providedCategories || fetchedCategories || [];

  return (
    <TextField
      select
      fullWidth={fullWidth}
      label={label}
      name={name}
      size={size}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      disabled={disabled}
      required={required}
    >
      {categories.map((cat) => (
        <MenuItem key={cat.id} value={cat.id}>
          {cat.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
