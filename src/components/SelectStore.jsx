import { MenuItem, TextField } from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

export default function SelectStore({
  value,
  onChange,
  readOnly = false,
  label = 'Store',
  name = 'store_id',
  helperText,
  required,
  ...props
}) {
  const stores = useLiveQuery(() => db.stores.orderBy('name').toArray(), []) || [];

  return (
    <TextField
      select
      fullWidth
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      disabled={readOnly}
      required={required}
      {...props}
    >
      {stores.map((store) => (
        <MenuItem key={store.id} value={store.id}>
          {store.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
