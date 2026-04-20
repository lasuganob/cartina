import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import PageHeader from '../../components/PageHeader';
import { db } from '../../lib/db';
import { formatCurrency } from '../../utils/formatCurrency';

const HIGHCHARTS_SCRIPT_ID = 'highcharts-cdn-script';
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 31 * 6;

function useHighcharts() {
  const [state, setState] = useState(() => ({
    loading: !window.Highcharts,
    error: ''
  }));

  useEffect(() => {
    if (window.Highcharts) {
      setState({ loading: false, error: '' });
      return undefined;
    }

    let cancelled = false;
    let script = document.getElementById(HIGHCHARTS_SCRIPT_ID);

    function handleReady() {
      if (!cancelled) {
        setState({ loading: false, error: '' });
      }
    }

    function handleError() {
      if (!cancelled) {
        setState({ loading: false, error: 'Failed to load Highcharts from CDN.' });
      }
    }

    if (!script) {
      script = document.createElement('script');
      script.id = HIGHCHARTS_SCRIPT_ID;
      script.src = 'https://code.highcharts.com/highcharts.js';
      script.async = true;
      document.body.appendChild(script);
    }

    script.addEventListener('load', handleReady);
    script.addEventListener('error', handleError);

    return () => {
      cancelled = true;
      script?.removeEventListener('load', handleReady);
      script?.removeEventListener('error', handleError);
    };
  }, []);

  return state;
}

function formatRecordDate(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return '';
  }

  return new Date(timestamp).toLocaleDateString();
}

function PriceTrendChart({ itemName, series }) {
  const { loading, error } = useHighcharts();
  const containerRef = useRef(null);

  useEffect(() => {
    if (loading || error || !containerRef.current || !window.Highcharts || !series.length) {
      return undefined;
    }

    const chart = window.Highcharts.chart(containerRef.current, {
      chart: {
        type: 'line',
        backgroundColor: 'transparent'
      },
      title: {
        text: `${itemName} Price Trend`
      },
      xAxis: {
        type: 'datetime'
      },
      yAxis: {
        title: {
          text: 'Price'
        }
      },
      legend: {
        enabled: true
      },
      series,
      credits: {
        enabled: false
      }
    });

    return () => {
      chart.destroy();
    };
  }, [error, itemName, loading, series]);

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return <Alert severity="warning">{error}</Alert>;
  }

  if (!series.length) {
    return (
      <Alert severity="info">
        No store-specific price points found for this item in the last 6 months.
      </Alert>
    );
  }

  return <div ref={containerRef} style={{ minHeight: 320, width: '100%' }} />;
}

export default function PriceHistoryPage() {
  const historyData =
    useLiveQuery(async () => {
      const [inventoryItems, checklistItems, trips, stores] = await Promise.all([
        db.inventoryItems.toArray(),
        db.tripChecklist.toArray(),
        db.trips.toArray(),
        db.stores.toArray()
      ]);

      return { inventoryItems, checklistItems, trips, stores };
    }, []) || {
      inventoryItems: [],
      checklistItems: [],
      trips: [],
      stores: []
    };

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);

  const itemOptions = useMemo(
    () =>
      historyData.inventoryItems
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name)),
    [historyData.inventoryItems]
  );
  useEffect(() => {
    if (!itemOptions.length) {
      if (selectedItem) {
        setSelectedItem(null);
      }
      return;
    }

    if (!selectedItem || !itemOptions.some((item) => String(item.id) === String(selectedItem.id))) {
      setSelectedItem(itemOptions[0]);
    }
  }, [itemOptions, selectedItem]);

  const records = useMemo(() => {
    if (!selectedItem) {
      return [];
    }

    const tripMap = historyData.trips.reduce((accumulator, trip) => {
      accumulator[trip.id] = trip;
      return accumulator;
    }, {});
    const storeMap = historyData.stores.reduce((accumulator, store) => {
      accumulator[store.id] = store;
      return accumulator;
    }, {});

    const cutoff = Date.now() - SIX_MONTHS_MS;
    return historyData.checklistItems
      .filter((item) => String(item.inventory_item_id) === String(selectedItem.id))
      .filter((item) => item.actual_price != null && item.actual_price !== '')
      .map((item) => {
        const trip = tripMap[item.trip_id];
        const store = trip?.store_id ? storeMap[trip.store_id] || null : null;
        const price = Number(item.actual_price);
        const timestamp = new Date(trip?.completed_at || trip?.planned_for || item.created_at).getTime();
        return {
          ...item,
          trip,
          store,
          price,
          timestamp
        };
      })
      .filter(
        (item) =>
          item.trip &&
          item.trip.status !== 'archived' &&
          item.trip.status !== 'cancelled' &&
          item.store &&
          Number.isFinite(item.price) &&
          Number.isFinite(item.timestamp) &&
          item.timestamp >= cutoff
      )
      .sort((left, right) => left.timestamp - right.timestamp);
  }, [historyData.checklistItems, historyData.stores, historyData.trips, selectedItem]);

  const comparisonStores = useMemo(
    () =>
      records
        .reduce((accumulator, record) => {
          if (!accumulator.some((store) => String(store.id) === String(record.store.id))) {
            accumulator.push(record.store);
          }
          return accumulator;
        }, [])
        .sort((left, right) => left.name.localeCompare(right.name)),
    [records]
  );

  useEffect(() => {
    if (!comparisonStores.length) {
      if (selectedStore) {
        setSelectedStore(null);
      }
      return;
    }

    if (!selectedStore || !comparisonStores.some((store) => String(store.id) === String(selectedStore.id))) {
      setSelectedStore(comparisonStores[0]);
    }
  }, [comparisonStores, selectedStore]);

  const storeSummaries = useMemo(() => {
    const groupedRecords = records.reduce((accumulator, record) => {
      const storeKey = String(record.store.id);

      if (!accumulator[storeKey]) {
        accumulator[storeKey] = {
          store: record.store,
          latestRecord: record
        };
      }

      if (record.timestamp >= accumulator[storeKey].latestRecord.timestamp) {
        accumulator[storeKey].latestRecord = record;
      }

      return accumulator;
    }, {});

    return Object.values(groupedRecords)
      .sort((left, right) => left.latestRecord.price - right.latestRecord.price);
  }, [records]);

  const analysis = useMemo(() => {
    const selectedStoreSummary = selectedStore
      ? storeSummaries.find((summary) => String(summary.store.id) === String(selectedStore.id)) || null
      : null;

    return {
      series: storeSummaries.map((summary) => ({
        name: summary.store.name,
        data: records
          .filter((record) => String(record.store.id) === String(summary.store.id))
          .map((record) => [record.timestamp, record.price])
      })),
      selectedStoreSummary,
      bestStore: storeSummaries[0] || null,
      worstStore: storeSummaries[storeSummaries.length - 1] || null
    };
  }, [records, selectedStore, storeSummaries]);

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Price History"
        description="Use recent purchase data to see item trends and spot cheaper stores."
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Item Trend by Store</Typography>
                <Autocomplete
                  options={itemOptions}
                  value={selectedItem}
                  onChange={(_, value) => setSelectedItem(value)}
                  isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                  getOptionLabel={(option) => option.name || ''}
                  renderInput={(params) => <TextField {...params} label="Search item" />}
                />
                {selectedItem ? (
                  <PriceTrendChart itemName={selectedItem.name} series={analysis.series} />
                ) : (
                  <Alert severity="info">Select an item to view store price trends.</Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Store Comparison</Typography>
                <Autocomplete
                  options={comparisonStores}
                  value={selectedStore}
                  onChange={(_, value) => setSelectedStore(value)}
                  isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                  getOptionLabel={(option) => option.name || ''}
                  renderInput={(params) => <TextField {...params} label="Compare store" />}
                />
                <Typography variant="body2" color="text.secondary">
                  This compares the latest recorded price for the selected item at each store.
                </Typography>
                {!selectedItem ? (
                  <Alert severity="info">Choose an item first to compare store pricing.</Alert>
                ) : !storeSummaries.length ? (
                  <Alert severity="info">No store-specific purchase history exists for this item yet.</Alert>
                ) : (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card variant="outlined">
                        <CardContent>
                          <Typography variant="overline" color="success.main">
                            Lowest Latest Price
                          </Typography>
                          <Typography variant="h6">
                            {analysis.bestStore?.store?.name || 'No store data'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {analysis.bestStore?.latestRecord?.price != null
                              ? formatCurrency(analysis.bestStore.latestRecord.price)
                              : 'No purchases yet'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {analysis.bestStore?.latestRecord
                              ? `Last updated ${formatRecordDate(analysis.bestStore.latestRecord.timestamp)}`
                              : ''}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="overline">Selected Store Latest</Typography>
                          <Typography variant="h6">
                            {selectedStore?.name || 'No store selected'}
                          </Typography>
                          <Typography variant="h6">
                            {analysis.selectedStoreSummary?.latestRecord?.price != null
                              ? formatCurrency(analysis.selectedStoreSummary.latestRecord.price)
                              : 'No purchases yet'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedStore
                              ? analysis.selectedStoreSummary?.latestRecord
                                ? `Last updated ${formatRecordDate(analysis.selectedStoreSummary.latestRecord.timestamp)}`
                                : `No recent price for ${selectedStore.name}.`
                              : 'Select a store to inspect its latest price.'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="overline" color="error.main">
                            Highest Latest Price
                          </Typography>
                          <Typography variant="h6">
                            {analysis.worstStore?.store?.name || 'No store data'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {analysis.worstStore?.latestRecord?.price != null
                              ? formatCurrency(analysis.worstStore.latestRecord.price)
                              : 'No purchases yet'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {analysis.worstStore?.latestRecord
                              ? `Last updated ${formatRecordDate(analysis.worstStore.latestRecord.timestamp)}`
                              : ''}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
