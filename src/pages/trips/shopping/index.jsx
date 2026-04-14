import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import StatusChip from '../../../components/StatusChip';
import BarcodeScannerDialog from '../../../components/BarcodeScannerDialog';
import { useTrips } from '../../../hooks/useTrips';
import { clearQueuedChecklistReplaces, db } from '../../../lib/db';
import { useBarcodeLookup } from '../../../hooks/useBarcodeLookup';

import ShoppingItemCard from './components/ShoppingItemCard';
import TripContextCard from './components/TripContextCard';
import UnplannedItemForm from './components/UnplannedItemForm';
import ShoppingProgressNav from './components/ShoppingProgressNav';

function getShoppingDraftKey(tripId) {
  return `trip-shopping-draft:${tripId}`;
}

function getShoppingSessionKey(tripId) {
  return `trip-shopping-session:${tripId}`;
}

function normalizeDraftItem(item, index) {
  return {
    id: item.id || crypto.randomUUID(),
    trip_id: item.trip_id || '',
    item_name: item.item_name || item.inventory_item?.name || '',
    inventory_item_id: item.inventory_item_id || '',
    inventory_item: item.inventory_item || null,
    barcode: item.barcode || item.inventory_item?.barcode || '',
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

function getCurrentElapsedMs(sessionState, now = Date.now()) {
  if (!sessionState) {
    return 0;
  }

  if (!sessionState.isRunning || !sessionState.lastStartedAt) {
    return Math.max(0, Number(sessionState.elapsedMs || 0));
  }

  return Math.max(0, Number(sessionState.elapsedMs || 0) + (now - sessionState.lastStartedAt));
}

export default function TripShoppingPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trips, loading, error, updateTrip, replaceTripChecklist } = useTrips();
  const [busy, setBusy] = useState(false);
  const [draftItems, setDraftItems] = useState([]);
  const [unplannedDraft, setUnplannedDraft] = useState({ item_name: '', quantity: 1, actual_price: '', barcode: '' });
  const [showUnplannedForm, setShowUnplannedForm] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const [tick, setTick] = useState(Date.now());
  const [sessionState, setSessionState] = useState({
    elapsedMs: 0,
    isRunning: true,
    lastStartedAt: Date.now(),
    startedAt: ''
  });
  const { lookup } = useBarcodeLookup();
  const persistRef = useRef({
    draftItems: [],
    sessionState: null,
    tripId: '',
    startedAt: ''
  });
  const hasPersistedOnExitRef = useRef(false);
  const isCompletingRef = useRef(false);
  const initializedTripIdRef = useRef('');
  const updateTripRef = useRef(updateTrip);
  const replaceTripChecklistRef = useRef(replaceTripChecklist);

  const trip = trips.find((item) => String(item.id) === String(tripId));

  useEffect(() => {
    updateTripRef.current = updateTrip;
    replaceTripChecklistRef.current = replaceTripChecklist;
  }, [replaceTripChecklist, updateTrip]);

  useEffect(() => {
    if (!trip || initializedTripIdRef.current === String(trip.id)) {
      return;
    }

    initializedTripIdRef.current = String(trip.id);
    const storedDraft = window.localStorage.getItem(getShoppingDraftKey(trip.id));
    const draftSource = storedDraft ? JSON.parse(storedDraft) : trip.items;
    const normalizedDraftItems = draftSource
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(normalizeDraftItem);

    setDraftItems(normalizedDraftItems);
  }, [trip]);

  useEffect(() => {
    if (!trip || initializedTripIdRef.current !== String(trip.id)) {
      return;
    }

    hasPersistedOnExitRef.current = false;
    const nowIso = new Date().toISOString();
    const storedSession = window.localStorage.getItem(getShoppingSessionKey(trip.id));
    const parsedSession = storedSession ? JSON.parse(storedSession) : null;

    setSessionState({
      elapsedMs: Math.max(0, Number(parsedSession?.elapsedMs ?? trip.elapsed_ms ?? 0)),
      isRunning: true,
      lastStartedAt: Date.now(),
      startedAt: parsedSession?.startedAt || trip.started_at || nowIso
    });
    void clearQueuedChecklistReplaces(trip.id);
  }, [trip]);

  useEffect(() => {
    if (!trip || !sessionState.isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [sessionState.isRunning, trip]);

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

  useEffect(() => {
    if (!trip) {
      return;
    }

    persistRef.current = {
      draftItems,
      sessionState,
      tripId: trip.id,
      startedAt: sessionState.startedAt || trip.started_at || ''
    };

    window.localStorage.setItem(
      getShoppingSessionKey(trip.id),
      JSON.stringify({
        elapsedMs: getCurrentElapsedMs(sessionState),
        startedAt: sessionState.startedAt
      })
    );
  }, [draftItems, sessionState, trip]);

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

  const elapsedMs = useMemo(
    () => getCurrentElapsedMs(sessionState, tick),
    [sessionState, tick]
  );

  useEffect(() => {
    function persistOnExit() {
      if (hasPersistedOnExitRef.current || isCompletingRef.current) {
        return;
      }

      hasPersistedOnExitRef.current = true;
      const current = persistRef.current;

      if (!current.tripId) {
        return;
      }

      const nextElapsedMs = getCurrentElapsedMs(current.sessionState);

      window.localStorage.setItem(
        getShoppingSessionKey(current.tripId),
        JSON.stringify({
          elapsedMs: nextElapsedMs,
          startedAt: current.startedAt || new Date().toISOString()
        })
      );

      void replaceTripChecklistRef.current(current.tripId, buildPersistedItems(current.draftItems, current.tripId), {
        sync: true,
        notify: false
      });
      void updateTripRef.current(current.tripId, {
        status: 'in_progress',
        started_at: current.startedAt || new Date().toISOString(),
        elapsed_ms: nextElapsedMs,
        completed_at: ''
      });
    }

    window.addEventListener('pagehide', persistOnExit);

    return () => {
      window.removeEventListener('pagehide', persistOnExit);
      persistOnExit();
    };
  }, []);

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
        barcode: unplannedDraft.barcode || '',
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
    setUnplannedDraft({ item_name: '', quantity: 1, actual_price: '', barcode: '' });
    setShowUnplannedForm(false);
  }

  const handleCloseScanner = useCallback(() => {
    setScannerOpen(false);
  }, []);

  const handleScanSuccess = useCallback(async (barcode) => {
    // 1. Search in current draft items for a match
    const existingIndex = draftItems.findIndex((item) => item.barcode == barcode);
    if (existingIndex !== -1) {
      // Auto-check the item
      handleUpdateItem(existingIndex, { is_purchased: true });
      return;
    }

    // 2. Not in checklist, look up in own data (local inventory)
    setBusy(true);
    try {
      const productInfo = await lookup(barcode);
      setUnplannedDraft({
        item_name: productInfo?.name || '',
        quantity: 1,
        actual_price: productInfo?.price ? String(productInfo.price) : '',
        barcode: barcode
      });
      setShowUnplannedForm(true);
    } finally {
      setBusy(false);
    }
  }, [draftItems, lookup]);

  async function handlePauseResume() {
    setSessionState((current) => {
      if (current.isRunning) {
        return {
          ...current,
          elapsedMs: getCurrentElapsedMs(current),
          isRunning: false,
          lastStartedAt: null
        };
      }

      return {
        ...current,
        isRunning: true,
        lastStartedAt: Date.now()
      };
    });
  }

  async function handleCheckout() {
    if (!trip) {
      return;
    }

    setBusy(true);
    try {
      isCompletingRef.current = true;
      hasPersistedOnExitRef.current = true;
      await replaceTripChecklist(trip.id, buildPersistedItems(draftItems, trip.id), {
        sync: true,
        notify: true
      });
      window.localStorage.removeItem(getShoppingDraftKey(trip.id));
      window.localStorage.removeItem(getShoppingSessionKey(trip.id));
      await updateTrip(trip.id, {
        status: 'completed',
        started_at: sessionState.startedAt || trip.started_at || new Date().toISOString(),
        elapsed_ms: elapsedMs,
        completed_at: new Date().toISOString(),
      });
      navigate(`/trips/${trip.id}`);
    } finally {
      isCompletingRef.current = false;
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

                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant={showUnplannedForm ? 'outlined' : 'contained'}
                      startIcon={<AddRoundedIcon />}
                      onClick={() => setShowUnplannedForm((current) => !current)}
                    >
                      Add Unplanned Item
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<QrCodeScannerRoundedIcon />}
                      onClick={() => setScannerOpen(true)}
                    >
                      Scan Barcode
                    </Button>
                  </Stack>
                  
                  {scannerOpen ? (
                    <BarcodeScannerDialog
                      open={scannerOpen}
                      onClose={handleCloseScanner}
                      onScanSuccess={handleScanSuccess}
                      variant="inline"
                    />
                  ) : null}

                  {showUnplannedForm ? (
                    <UnplannedItemForm
                      unplannedDraft={unplannedDraft}
                      setUnplannedDraft={setUnplannedDraft}
                      handleAddUnplannedItem={handleAddUnplannedItem}
                      setShowUnplannedForm={setShowUnplannedForm}
                      onScanClick={() => setScannerOpen(true)}
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
        isInProgress={sessionState.isRunning}
        actionsExpanded={actionsExpanded}
        setActionsExpanded={setActionsExpanded}
        busy={busy}
        draftItemsLength={draftItems.length}
        elapsedMs={elapsedMs}
        handleCheckout={handleCheckout}
        handlePauseResume={handlePauseResume}
      />

      {/* Scanner is now inline above, but we keep the logic the same */}
    </>
  );
}
