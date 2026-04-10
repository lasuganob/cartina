import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import StatusChip from '../../../components/StatusChip';
import { useTrips } from '../../../hooks/useTrips';
import { clearQueuedChecklistReplaces } from '../../../lib/db';

import ShoppingItemCard from './components/ShoppingItemCard';
import TripContextCard from './components/TripContextCard';
import UnplannedItemForm from './components/UnplannedItemForm';
import ShoppingProgressNav from './components/ShoppingProgressNav';

function getShoppingDraftKey(tripId) {
  return `trip-shopping-draft:${tripId}`;
}

function normalizeDraftItem(item, index) {
  return {
    id: item.id || crypto.randomUUID(),
    trip_id: item.trip_id || '',
    item_name: item.item_name || item.inventory_item?.name || '',
    inventory_item_id: item.inventory_item_id || '',
    inventory_item: item.inventory_item || null,
    quantity: Math.max(1, Number(item.quantity || 1)),
    planned_price:
      item.planned_price === '' || item.planned_price === null || item.planned_price === undefined
        ? ''
        : String(item.planned_price),
    actual_price:
      item.actual_price === '' || item.actual_price === null || item.actual_price === undefined
        ? ''
        : String(item.actual_price),
    is_purchased: Boolean(item.is_purchased),
    is_unplanned: Boolean(item.is_unplanned),
    sort_order: Number(item.sort_order ?? index),
    created_at: item.created_at || new Date().toISOString()
  };
}

function buildPersistedItems(items, tripId) {
  return items.map((item, index) => ({
    ...item,
    trip_id: tripId,
    quantity: Math.max(1, Number(item.quantity || 1)),
    planned_price: item.planned_price === '' ? null : Number(item.planned_price),
    actual_price: item.actual_price === '' ? null : Number(item.actual_price),
    sort_order: index
  }));
}

export default function TripShoppingPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trips, loading, error, updateTrip, replaceTripChecklist } = useTrips();
  const [busy, setBusy] = useState(false);
  const [draftItems, setDraftItems] = useState([]);
  const [unplannedDraft, setUnplannedDraft] = useState({ item_name: '', quantity: 1, actual_price: '' });
  const [showUnplannedForm, setShowUnplannedForm] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const [tick, setTick] = useState(Date.now());
  const initializedRef = useRef(false);

  const trip = trips.find((item) => String(item.id) === String(tripId));

  useEffect(() => {
    if (!trip) {
      return;
    }

    const storedDraft = window.localStorage.getItem(getShoppingDraftKey(trip.id));
    const draftSource = storedDraft ? JSON.parse(storedDraft) : trip.items;
    const normalizedDraftItems = draftSource
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(normalizeDraftItem);

    setDraftItems(normalizedDraftItems);
  }, [trip]);

  useEffect(() => {
    if (!trip || initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    if (trip.status !== 'in_progress') {
      void updateTrip(trip.id, {
        status: 'in_progress',
        started_at: trip.started_at || new Date().toISOString(),
        shopping_paused: false,
        shopping_paused_at: '',
        paused_duration_ms: Number(trip.paused_duration_ms || 0)
      });
    } else if (!trip.started_at) {
      void updateTrip(trip.id, { started_at: new Date().toISOString() });
    }

    void clearQueuedChecklistReplaces(trip.id);
  }, [trip, updateTrip]);

  useEffect(() => {
    if (!trip?.started_at || trip.shopping_paused) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [trip?.started_at, trip?.shopping_paused]);

  useEffect(() => {
    if (!trip) {
      return undefined;
    }

    window.localStorage.setItem(
      getShoppingDraftKey(trip.id),
      JSON.stringify(buildPersistedItems(draftItems, trip.id))
    );

    return undefined;
  }, [draftItems, trip]);

  const metrics = useMemo(() => {
    const checkedCount = draftItems.filter((item) => item.is_purchased).length;
    const unplannedCount = draftItems.filter((item) => item.is_unplanned).length;
    const subtotal = draftItems.reduce(
      (sum, item) => sum + Number(item.actual_price || 0) * Number(item.quantity || 1),
      0
    );
    const plannedTotal = draftItems.reduce(
      (sum, item) => sum + Number(item.planned_price || 0) * Number(item.quantity || 1),
      0
    );
    const variance = subtotal - plannedTotal;
    const progress = draftItems.length ? (checkedCount / draftItems.length) * 100 : 0;

    return { checkedCount, unplannedCount, subtotal, plannedTotal, variance, progress };
  }, [draftItems]);

  const elapsedMs = useMemo(() => {
    if (!trip?.started_at) {
      return 0;
    }

    const startedAt = new Date(trip.started_at).getTime();
    const pausedDuration = Number(trip.paused_duration_ms || 0);
    const pausedAt = trip.shopping_paused_at ? new Date(trip.shopping_paused_at).getTime() : null;
    const endPoint = trip.shopping_paused && pausedAt ? pausedAt : tick;
    return Math.max(0, endPoint - startedAt - pausedDuration);
  }, [tick, trip]);

  async function handleUpdateItem(index, changes) {
    setDraftItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...changes } : item))
    );
  }

  function handleAddUnplannedItem() {
    const newItem = normalizeDraftItem(
      {
        id: crypto.randomUUID(),
        trip_id: trip.id,
        item_name: unplannedDraft.item_name.trim(),
        quantity: unplannedDraft.quantity,
        planned_price: '',
        actual_price: unplannedDraft.actual_price,
        is_purchased: unplannedDraft.actual_price !== '',
        is_unplanned: true,
        sort_order: -1,
        created_at: new Date().toISOString()
      },
      0
    );

    setDraftItems((current) => [newItem, ...current]);
    setUnplannedDraft({ item_name: '', quantity: 1, actual_price: '' });
    setShowUnplannedForm(false);
  }

  async function handlePauseResume() {
    if (!trip) {
      return;
    }

    setBusy(true);
    try {
      if (trip.shopping_paused) {
        const resumedPausedDuration =
          Number(trip.paused_duration_ms || 0) +
          (Date.now() - new Date(trip.shopping_paused_at).getTime());

        await updateTrip(trip.id, {
          shopping_paused: false,
          shopping_paused_at: '',
          paused_duration_ms: resumedPausedDuration
        });
        return undefined;
      }

      await updateTrip(trip.id, {
        shopping_paused: true,
        shopping_paused_at: new Date().toISOString()
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckout() {
    if (!trip) {
      return;
    }

    setBusy(true);
    try {
      await replaceTripChecklist(trip.id, buildPersistedItems(draftItems, trip.id), {
        sync: true,
        notify: true
      });
      window.localStorage.removeItem(getShoppingDraftKey(trip.id));
      await updateTrip(trip.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        shopping_paused: false,
        shopping_paused_at: ''
      });
      navigate(`/trips/${trip.id}`);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Starting Trip" description="Loading shopping checklist." />
        <LinearProgress />
      </>
    );
  }

  if (!trip) {
    return (
      <>
        <PageHeader
          eyebrow="Grocery Trips"
          title="Trip Not Found"
          description="The requested trip does not exist in local storage."
          action={
            <Button component={NavLink} to="/trips" variant="contained">
              Back to Trips
            </Button>
          }
        />
        <Alert severity="warning">No trip matched ID `{tripId}`.</Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={<StatusChip status={trip.status} />}
        title={`${trip.name} Shopping`}
        description={trip.store?.name ? `Shopping at ${trip.store.name}` : 'Track actual spend while shopping.'}
        action={
          <Button component={NavLink} to={`/trips/${trip.id}`} variant="outlined">
            Back to Trip
          </Button>
        }
      />

      {error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Failed to refresh from GAS. Showing cached IndexedDB data.
        </Alert>
      ) : null}

      <Grid container spacing={3} sx={{ pb: 18 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={1.5}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="h6">Shopping Checklist</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Check items as you shop and capture the actual line price.
                      </Typography>
                    </Stack>
                    <Chip label={`${draftItems.length} item${draftItems.length === 1 ? '' : 's'}`} variant="outlined" />
                  </Stack>

                  <Box>
                    <Button
                      variant={showUnplannedForm ? 'outlined' : 'contained'}
                      startIcon={<AddRoundedIcon />}
                      onClick={() => setShowUnplannedForm((current) => !current)}
                    >
                      Add Unplanned Item
                    </Button>
                  </Box>

                  {showUnplannedForm ? (
                    <UnplannedItemForm
                      unplannedDraft={unplannedDraft}
                      setUnplannedDraft={setUnplannedDraft}
                      handleAddUnplannedItem={handleAddUnplannedItem}
                      setShowUnplannedForm={setShowUnplannedForm}
                    />
                  ) : null}

                  <Divider />

                  {!draftItems.length ? (
                    <Stack spacing={1} alignItems="flex-start">
                      <Typography color="text.secondary">
                        No checklist items yet. Build the trip checklist first.
                      </Typography>
                      <Button component={NavLink} to={`/trips/${trip.id}`} variant="outlined">
                        Go to Trip Details
                      </Button>
                    </Stack>
                  ) : (
                    <Stack spacing={2}>
                      {draftItems.map((item, index) => (
                        <ShoppingItemCard
                          key={item.id}
                          item={item}
                          index={index}
                          onChange={(changes) => handleUpdateItem(index, changes)}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <TripContextCard trip={trip} metrics={metrics} />
          </Stack>
        </Grid>
      </Grid>

      <ShoppingProgressNav
        trip={trip}
        metrics={metrics}
        isInProgress={!trip.shopping_paused}
        actionsExpanded={actionsExpanded}
        setActionsExpanded={setActionsExpanded}
        busy={busy}
        draftItemsLength={draftItems.length}
        elapsedMs={elapsedMs}
        handleCheckout={handleCheckout}
        handlePauseResume={handlePauseResume}
      />
    </>
  );
}
