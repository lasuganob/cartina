import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../../lib/db';
import BudgetRunningTotal from './BuildChecklistDialogComponents/BudgetRunningTotal';
import AddItem from './BuildChecklistDialogComponents/AddItem';
import ChecklistItems from './BuildChecklistDialogComponents/ChecklistItems';

function buildDraftItem(item, index) {
  return {
    id: item.id,
    trip_id: item.trip_id,
    item_name: item.item_name || item.inventory_item?.name || '',
    inventory_item_id: item.inventory_item_id || '',
    quantity: Math.max(1, Number(item.quantity || 1)),
    planned_price: item.planned_price ?? item.inventory_item?.usual_price ?? '',
    actual_price: item.actual_price ?? '',
    is_purchased: Boolean(item.is_purchased),
    is_unplanned: Boolean(item.is_unplanned),
    sort_order: item.sort_order ?? index,
    created_at: item.created_at,
    inventory_item: item.inventory_item || null
  };
}

function getDuplicateIndex(items, candidate) {
  if (candidate.inventory_item_id) {
    return items.findIndex((item) => item.inventory_item_id === candidate.inventory_item_id);
  }

  const normalizedName = candidate.item_name.trim().toLowerCase();
  if (!normalizedName) {
    return -1;
  }

  return items.findIndex(
    (item) =>
      !item.inventory_item_id && String(item.item_name || '').trim().toLowerCase() === normalizedName
  );
}

export default function BuildChecklistDialog({ open, trip, busy, onClose, onSave }) {
  const inventoryData =
    useLiveQuery(async () => {
      const [inventoryItems, categories] = await Promise.all([
        db.inventoryItems.toArray(),
        db.categories.toArray()
      ]);

      const categoriesById = categories.reduce((accumulator, category) => {
        accumulator[category.id] = category;
        return accumulator;
      }, {});

      return inventoryItems
        .map((item) => ({
          ...item,
          category: item.category_id ? categoriesById[item.category_id] || null : null
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
    }, []) || [];

  const [draftItems, setDraftItems] = useState(() =>
    (trip?.items || []).map((item, index) => buildDraftItem(item, index))
  );
  const [addDraft, setAddDraft] = useState({
    option: null,
    item_name: '',
    quantity: 1,
    planned_price: ''
  });
  const [pendingDuplicate, setPendingDuplicate] = useState(null);

  useEffect(() => {
    if (open) {
      setDraftItems((trip.items || []).map((item, index) => buildDraftItem(item, index)));
      setAddDraft({
        option: null,
        item_name: '',
        quantity: 1,
        planned_price: ''
      });
      setPendingDuplicate(null);
    }
  }, [open, trip]);

  const plannedTotal = useMemo(
    () =>
      draftItems.reduce(
        (sum, item) => sum + Number(item.planned_price || 0) * Number(item.quantity || 0),
        0
      ),
    [draftItems]
  );
  const remainingBudget = Number(trip.budget || 0) - plannedTotal;

  function handleDialogClose(_, reason) {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }

    onClose();
  }

  function updateItem(index, changes) {
    setDraftItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...changes
            }
          : item
      )
    );
  }

  function removeItem(index) {
    setDraftItems((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, sort_order: itemIndex }))
    );
  }

  function resetAddDraft() {
    setAddDraft({
      option: null,
      item_name: '',
      quantity: 1,
      planned_price: ''
    });
  }

  function buildCandidateFromAddDraft() {
    const selectedOption =
      addDraft.option && typeof addDraft.option === 'object' ? addDraft.option : null;
    const itemName = selectedOption?.name || addDraft.item_name.trim();

    return {
      item_name: itemName,
      inventory_item_id: selectedOption?.id || '',
      quantity: Math.max(1, Number(addDraft.quantity || 1)),
      planned_price:
        addDraft.planned_price === '' || addDraft.planned_price == null
          ? selectedOption?.usual_price ?? ''
          : Number(addDraft.planned_price),
      actual_price: '',
      is_purchased: false,
      is_unplanned: !selectedOption,
      inventory_item: selectedOption
        ? {
            ...selectedOption,
            category: selectedOption.category || null
          }
        : null
    };
  }

  function commitNewItem(candidate) {
    setDraftItems((current) => [
      ...current,
      {
        ...candidate,
        id: crypto.randomUUID(),
        sort_order: current.length
      }
    ]);
    resetAddDraft();
  }

  function handleAddItem() {
    const candidate = buildCandidateFromAddDraft();

    if (!candidate.item_name) {
      return;
    }

    const duplicateIndex = getDuplicateIndex(draftItems, candidate);
    if (duplicateIndex >= 0) {
      setPendingDuplicate({ candidate, duplicateIndex });
      return;
    }

    commitNewItem(candidate);
  }

  async function handleSave() {
    await onSave(
      draftItems.map((item, index) => ({
        ...item,
        sort_order: index,
        planned_price: item.planned_price === '' ? null : Number(item.planned_price || 0),
        actual_price: item.actual_price === '' ? null : Number(item.actual_price || 0)
      }))
    );
  }

  function confirmDuplicateMerge() {
    if (!pendingDuplicate) {
      return;
    }

    const { candidate, duplicateIndex } = pendingDuplicate;

    setDraftItems((current) =>
      current.map((item, index) =>
        index === duplicateIndex
          ? {
              ...item,
              quantity: Number(item.quantity || 0) + Number(candidate.quantity || 0),
              planned_price:
                item.planned_price === '' || item.planned_price == null
                  ? candidate.planned_price
                  : item.planned_price
            }
          : item
      )
    );

    setPendingDuplicate(null);
    resetAddDraft();
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        disableEscapeKeyDown
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Build Checklist</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Alert severity="info">
              Build the trip checklist from your inventory or add custom one-off items. Duplicate
              additions can be merged into an existing row by increasing quantity.
            </Alert>

            <BudgetRunningTotal 
              trip={trip}
              plannedTotal={plannedTotal}
              remainingBudget={remainingBudget}
            />

            <AddItem 
              inventoryData={inventoryData}
              addDraft={addDraft}
              setAddDraft={setAddDraft}
              handleAddItem={handleAddItem}
            />

            <ChecklistItems 
              draftItems={draftItems}
              updateItem={updateItem}
              removeItem={removeItem}
            />

          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={busy} sx={{ width: "100%" }} startIcon={<CancelRoundedIcon />}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={busy} sx={{ width: "100%" }} startIcon={<SaveRoundedIcon />}>
            {busy ? 'Saving...' : 'Save Checklist'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(pendingDuplicate)} onClose={() => setPendingDuplicate(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Item Already Exists</DialogTitle>
        <DialogContent dividers>
          <Typography>
            This item is already in the checklist. Confirm to increase the existing quantity instead
            of adding a duplicate row.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDuplicate(null)}>Cancel</Button>
          <Button variant="contained" onClick={confirmDuplicateMerge}>
            Increase Quantity
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
