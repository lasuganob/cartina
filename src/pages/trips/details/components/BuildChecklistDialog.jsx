import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Box
} from '@mui/material';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../../lib/db';
import BudgetRunningTotal from './BuildChecklistDialogComponents/BudgetRunningTotal';
import AddItem from './BuildChecklistDialogComponents/AddItem';
import ChecklistItems from './BuildChecklistDialogComponents/ChecklistItems';
import { useState, useMemo, useEffect } from 'react';

function buildDraftItem(item, index) {
  return {
    id: item.id,
    draft_key: item.draft_key || item.id || `draft-${index}-${item.item_name || 'item'}`,
    trip_id: item.trip_id,
    item_name: item.item_name || item.inventory_item?.name || '',
    inventory_item_id: item.inventory_item_id || '',
    barcode: item.barcode || item.inventory_item?.barcode || '',
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      barcode: selectedOption?.barcode || '',
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
        draft_key: `draft-${Date.now()}-${current.length}`,
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
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 1,
            bgcolor: 'background.default'
          }
        }}
      >
        <DialogTitle sx={{ 
          m: 0, 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Build Checklist</Typography>
          {isMobile ? (
            <IconButton onClick={onClose} disabled={busy} edge="end">
              <CloseRoundedIcon />
            </IconButton>
          ) : null}
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 1.5 : 3 }}>
          <Stack spacing={isMobile ? 2 : 3} sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Build the trip checklist from your inventory. 
              {isMobile ? '' : ' Duplicate additions can be merged into an existing row.'}
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

            <Box sx={{ pb: isMobile ? 10 : 0 }}>
              <ChecklistItems 
                draftItems={draftItems}
                updateItem={updateItem}
                removeItem={removeItem}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          borderTop: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: isMobile ? 'fixed' : 'relative',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.modal + 1
        }}>
          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
            {!isMobile && (
              <Button 
                variant="outlined"
                onClick={onClose} 
                disabled={busy} 
                sx={{ flex: 1, borderRadius: 2 }} 
                startIcon={<CancelRoundedIcon />}
              >
                Cancel
              </Button>
            )}
            <Button 
              variant="contained" 
              onClick={handleSave} 
              disabled={busy} 
              sx={{ flex: 2, borderRadius: 2, py: isMobile ? 1.5 : 1 }} 
              startIcon={<SaveRoundedIcon />}
            >
              {busy ? 'Saving...' : 'Save Checklist'}
            </Button>
          </Stack>
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
