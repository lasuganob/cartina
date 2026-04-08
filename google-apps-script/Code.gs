const SHEET_NAMES = {
  trips: 'Trips'
};

function doGet(e) {
  try {
    const path = getPath_(e);

    if (path === '/trips') {
      return jsonResponse_({
        success: true,
        items: getTrips_()
      });
    }

    return jsonResponse_({ success: false, message: 'Route not found.' });
  } catch (error) {
    return jsonResponse_({ success: false, message: error.message });
  }
}

function doPost(e) {
  try {
    const path = getPath_(e);
    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');

    if (path === '/trips') {
      return jsonResponse_({
        success: true,
        item: createTrip_(payload)
      });
    }

    return jsonResponse_({ success: false, message: 'Route not found.' });
  } catch (error) {
    return jsonResponse_({ success: false, message: error.message });
  }
}

function getTrips_() {
  const sheet = getOrCreateSheet_(SHEET_NAMES.trips, [
    'id',
    'name',
    'planned_for',
    'budget',
    'status',
    'store_id',
    'created_at',
    'completed_at'
  ]);
  const values = sheet.getDataRange().getValues();

  if (values.length === 1) {
    return [];
  }

  const headers = values[0];
  return values.slice(1).map(function(row) {
    var item = {};
    headers.forEach(function(header, index) {
      item[header] = row[index];
    });
    return item;
  });
}

function createTrip_(payload) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.trips, [
    'id',
    'name',
    'planned_for',
    'budget',
    'status',
    'store_id',
    'created_at',
    'completed_at'
  ]);

  const budget = Number(payload.budget || 0);
  const trip = {
    id: payload.id || Utilities.getUuid(),
    name: payload.name || '',
    planned_for:
      payload.planned_for ||
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    budget: budget,
    status: payload.status || 'planned',
    store_id: payload.store_id || '',
    created_at: payload.created_at || new Date().toISOString(),
    completed_at: payload.completed_at || ''
  };

  sheet.appendRow([
    trip.id,
    trip.name,
    trip.planned_for,
    trip.budget,
    trip.status,
    trip.store_id,
    trip.created_at,
    trip.completed_at
  ]);

  return trip;
}

function getPath_(e) {
  return (e && e.parameter && e.parameter.path) || '/';
}

function getOrCreateSheet_(name, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
