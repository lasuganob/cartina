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

function PriceTrendChart({ itemName, points }) {
  const { loading, error } = useHighcharts();
  const containerRef = useRef(null);

  useEffect(() => {
    if (loading || error || !containerRef.current || !window.Highcharts || !points.length) {
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
        enabled: false
      },
      series: [
        {
          name: itemName,
          data: points.map((point) => [point.timestamp, point.price]),
          color: '#4a6555'
        }
      ],
      credits: {
        enabled: false
      }
    });

    return () => {
      chart.destroy();
    };
  }, [error, itemName, loading, points]);

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return <Alert severity="warning">{error}</Alert>;
  }

  if (!points.length) {
    return (
      <Alert severity="info">
        No purchased price points found for this item in the last 6 months.
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

  const itemOptions = useMemo(
    () =>
      historyData.inventoryItems
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name)),
    [historyData.inventoryItems]
  );

  useEffect(() => {
    if (!selectedItem && itemOptions.length) {
      setSelectedItem(itemOptions[0]);
    }
  }, [itemOptions, selectedItem]);

  const analysis = useMemo(() => {
    if (!selectedItem) {
      return {
        points: [],
        bestPrice: null,
        averagePrice: null,
        worstPrice: null
      };
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
    const records = historyData.checklistItems
      .filter((item) => String(item.inventory_item_id) === String(selectedItem.id))
      .filter((item) => item.actual_price != null && item.actual_price !== '')
      .map((item) => {
        const trip = tripMap[item.trip_id];
        const timestamp = new Date(trip?.completed_at || trip?.planned_for || item.created_at).getTime();
        return {
          ...item,
          trip,
          store: trip?.store_id ? storeMap[trip.store_id] || null : null,
          timestamp
        };
      })
      .filter((item) => Number.isFinite(item.timestamp) && item.timestamp >= cutoff)
      .sort((left, right) => left.timestamp - right.timestamp);

    const points = records.map((item) => ({
      timestamp: item.timestamp,
      price: Number(item.actual_price)
    }));

    const averagePrice = records.length
      ? records.reduce((sum, item) => sum + Number(item.actual_price), 0) / records.length
      : null;

    const sortedByPrice = records.slice().sort((left, right) => Number(left.actual_price) - Number(right.actual_price));

    return {
      points,
      averagePrice,
      bestPrice: sortedByPrice[0] || null,
      worstPrice: sortedByPrice[sortedByPrice.length - 1] || null
    };
  }, [historyData.checklistItems, historyData.stores, historyData.trips, selectedItem]);

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
                <Typography variant="h6">Item Search & Trend</Typography>
                <Autocomplete
                  options={itemOptions}
                  value={selectedItem}
                  onChange={(_, value) => setSelectedItem(value)}
                  getOptionLabel={(option) => option.name || ''}
                  renderInput={(params) => <TextField {...params} label="Search item" />}
                />
                {selectedItem ? (
                  <PriceTrendChart itemName={selectedItem.name} points={analysis.points} />
                ) : (
                  <Alert severity="info">Select an inventory item to view its price trend.</Alert>
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
                <Typography variant="body2" color="text.secondary">
                  This leaderboard highlights the best and worst recorded prices for the selected item.
                </Typography>
                {!selectedItem ? (
                  <Alert severity="info">Choose an item first to compare store pricing.</Alert>
                ) : (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="overline" color="success.main">
                            Best Price Found
                          </Typography>
                          <Typography variant="h6">
                            {analysis.bestPrice?.store?.name || 'No store data'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {analysis.bestPrice ? formatCurrency(analysis.bestPrice.actual_price) : 'No purchases yet'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="overline">Average Price</Typography>
                          <Typography variant="h6">
                            {analysis.averagePrice != null ? formatCurrency(analysis.averagePrice) : 'No purchases yet'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Based on the last 6 months of recorded actual prices.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="overline" color="error.main">
                            Worst Price
                          </Typography>
                          <Typography variant="h6">
                            {analysis.worstPrice?.store?.name || 'No store data'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {analysis.worstPrice ? formatCurrency(analysis.worstPrice.actual_price) : 'No purchases yet'}
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
