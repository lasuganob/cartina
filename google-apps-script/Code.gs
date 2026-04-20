const SHEET_NAMES = {
  trips: "Trips",
  tripChecklist: "trip_checklist",
  inventoryItems: "inventory_items",
  stores: "stores",
  categories: "categories",
};

const TRIP_HEADERS = [
  "id",
  "name",
  "planned_for",
  "budget",
  "status",
  "store_id",
  "note",
  "created_at",
  "updated_at",
  "started_at",
  "elapsed_ms",
  "completed_at",
  "archived_at",
];

const INVENTORY_HEADERS = [
  "id",
  "name",
  "category_id",
  "usual_price",
  "barcode",
  "has_no_barcode",
  "created_at",
  "updated_at",
];

const STORE_HEADERS = ["id", "name", "logo_path", "updated_at"];
const CATEGORY_HEADERS = ["id", "name", "updated_at"];
const TRIP_CHECKLIST_HEADERS = [
  "id",
  "trip_id",
  "inventory_item_id",
  "item_name",
  "category_id",
  "quantity",
  "planned_price",
  "actual_price",
  "is_purchased",
  "is_unplanned",
  "is_ad_hoc",
  "barcode",
  "sort_order",
  "created_at",
];

const GET_ROUTES = {
  "/trips": function () {
    return {
      success: true,
      items: getTrips_(),
      trip_checklist: getTripChecklist_(),
      inventory_items: getInventoryItems_(),
      stores: getStores_(),
      categories: getCategories_(),
    };
  },
  "/trips/next-id": function () {
    return {
      success: true,
      next_id: getNextTripId_(),
    };
  },
  "/trip-checklist/next-ids": function (e) {
    return {
      success: true,
      ids: getNextTripChecklistIds_(e),
    };
  },
  "/stores": function () {
    return {
      success: true,
      items: getStores_(),
    };
  },
  "/categories": function () {
    return {
      success: true,
      items: getCategories_(),
    };
  },
  "/categories/next-id": function () {
    return {
      success: true,
      next_id: getNextCategoryId_(),
    };
  },
  "/stores/next-id": function () {
    return {
      success: true,
      next_id: getNextStoreId_(),
    };
  },
  "/inventory-items/next-id": function () {
    return {
      success: true,
      next_id: getNextInventoryItemId_(),
    };
  },
  "/inventory-items": function () {
    return {
      success: true,
      items: getInventoryItems_(),
    };
  },
};

const POST_ROUTES = {
  "/trips": function (_, payload) {
    return {
      success: true,
      item: createTrip_(payload),
    };
  },
  "/trips/update": function (_, payload) {
    return {
      success: true,
      item: updateTrip_(payload),
    };
  },
  "/trip-checklist/replace": function (_, payload) {
    return {
      success: true,
      items: replaceTripChecklist_(payload),
    };
  },
  "/inventory-items": function (_, payload) {
    return {
      success: true,
      item: createInventoryItem_(payload),
    };
  },
  "/inventory-items/update": function (_, payload) {
    return {
      success: true,
      item: updateInventoryItem_(payload),
    };
  },
  "/inventory-items/delete": function (_, payload) {
    return {
      success: true,
      id: deleteInventoryItem_(payload),
    };
  },
  "/stores": function (_, payload) {
    return {
      success: true,
      item: createStore_(payload),
    };
  },
  "/stores/update": function (_, payload) {
    return {
      success: true,
      item: updateStore_(payload),
    };
  },
  "/stores/delete": function (_, payload) {
    return {
      success: true,
      id: deleteStore_(payload),
    };
  },
  "/categories": function (_, payload) {
    return {
      success: true,
      item: createCategory_(payload),
    };
  },
  "/categories/update": function (_, payload) {
    return {
      success: true,
      item: updateCategory_(payload),
    };
  },
  "/categories/delete": function (_, payload) {
    return {
      success: true,
      id: deleteCategory_(payload),
    };
  },
};

function doGet(e) {
  return handleRequest_(GET_ROUTES, e);
}

function doPost(e) {
  return handleRequest_(POST_ROUTES, e, parseRequestPayload_(e));
}

function getTrips_() {
  return getRows_(SHEET_NAMES.trips, TRIP_HEADERS);
}

function getNextTripId_() {
  return getNextSheetId_(SHEET_NAMES.trips, TRIP_HEADERS);
}

function getNextTripChecklistIds_(e) {
  const requestedCount = Number((e && e.parameter && e.parameter.count) || 0);
  const count = Math.max(0, Math.floor(requestedCount));

  if (count === 0) {
    return [];
  }

  const sheet = getOrCreateSheet_(SHEET_NAMES.tripChecklist, TRIP_CHECKLIST_HEADERS);
  const values = getSheetValues_(sheet);
  var nextId = getNextNumericId_(values, TRIP_CHECKLIST_HEADERS);
  var ids = [];

  for (var index = 0; index < count; index += 1) {
    ids.push(nextId);
    nextId += 1;
  }

  return ids;
}

function getNextStoreId_() {
  return getNextSheetId_(SHEET_NAMES.stores, STORE_HEADERS);
}

function getNextCategoryId_() {
  return getNextSheetId_(SHEET_NAMES.categories, CATEGORY_HEADERS);
}

function getNextInventoryItemId_() {
  return getNextSheetId_(SHEET_NAMES.inventoryItems, INVENTORY_HEADERS);
}

function createTrip_(payload) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.trips, TRIP_HEADERS);
  const trip = buildTripRecord_(payload, {
    id: resolveRowId_(sheet, TRIP_HEADERS, payload.id),
  });
  appendRecord_(sheet, TRIP_HEADERS, trip);
  return trip;
}

function updateTrip_(payload) {
  if (!payload.id) {
    throw new Error("Trip id is required.");
  }

  return updateSheetRecord_(
    SHEET_NAMES.trips,
    TRIP_HEADERS,
    payload,
    "Trip not found.",
    buildTripRecord_,
  );
}

function getTripChecklist_() {
  return getRows_(SHEET_NAMES.tripChecklist, TRIP_CHECKLIST_HEADERS);
}

function replaceTripChecklist_(payload) {
  if (!payload.trip_id) {
    throw new Error("trip_id is required.");
  }

  var tripsSheet = getOrCreateSheet_(SHEET_NAMES.trips, TRIP_HEADERS);
  var tripsValues = getSheetValues_(tripsSheet);
  var tripMatch = findRowById_(tripsValues, payload.trip_id);
  
  if (tripMatch) {
    var tripRecord = mapRowToObject_(tripsValues[0], tripMatch.row);
    if (payload.base_updated_at && String(tripRecord.updated_at) !== String(payload.base_updated_at)) {
      return { success: false, conflict: true, remote_trip: tripRecord };
    }
  }

  var items = Array.isArray(payload.items) ? payload.items : [];
  var headers = TRIP_CHECKLIST_HEADERS;
  var sheet = getOrCreateSheet_(SHEET_NAMES.tripChecklist, headers);
  var values = getSheetValues_(sheet);
  headers = values[0];
  var tripIdIndex = headers.indexOf("trip_id");
  var nextId = getNextNumericId_(values, headers);
  var preservedRows = values.slice(1).filter(function (row) {
    return String(row[tripIdIndex]) !== String(payload.trip_id);
  });

  if (!items.length) {
    rewriteSheetBody_(sheet, headers, preservedRows);
    return [];
  }

  var normalizedItems = items.map(function (item, index) {
    var resolvedId = resolveSequentialId_(item.id, function () {
      var generatedId = nextId;
      nextId += 1;
      return generatedId;
    });

    return buildTripChecklistItem_(item, {
      id: resolvedId,
      trip_id: payload.trip_id,
      sort_order: index,
    });
  });

  var rows = normalizedItems.map(function (item) {
    return toOrderedRow_(headers, item);
  });
  rewriteSheetBody_(sheet, headers, preservedRows.concat(rows));

  // Update trip's updated_at
  if (tripMatch) {
    var updatedTrip = buildTripRecord_({}, tripRecord);
    tripsSheet
      .getRange(tripMatch.rowIndex + 1, 1, 1, TRIP_HEADERS.length)
      .setValues([toOrderedRow_(TRIP_HEADERS, updatedTrip)]);
  }

  return normalizedItems;
}

function getInventoryItems_() {
  return getRows_(SHEET_NAMES.inventoryItems, INVENTORY_HEADERS);
}

function createInventoryItem_(payload) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.inventoryItems, INVENTORY_HEADERS);
  const item = buildInventoryItemRecord_(payload, {
    id: resolveRowId_(sheet, INVENTORY_HEADERS, payload.id),
  });
  appendRecord_(sheet, INVENTORY_HEADERS, item);
  return item;
}

function updateInventoryItem_(payload) {
  if (!payload.id) {
    throw new Error("Inventory item id is required.");
  }

  return updateSheetRecord_(
    SHEET_NAMES.inventoryItems,
    INVENTORY_HEADERS,
    payload,
    "Inventory item not found.",
    buildInventoryItemRecord_,
  );
}

function deleteInventoryItem_(payload) {
  if (!payload.id) {
    throw new Error("Inventory item id is required.");
  }

  return deleteSheetRecord_(
    SHEET_NAMES.inventoryItems,
    INVENTORY_HEADERS,
    payload,
    "Inventory item not found.",
  );
}

function getStores_() {
  return getRows_(SHEET_NAMES.stores, STORE_HEADERS);
}

function getCategories_() {
  return getRows_(SHEET_NAMES.categories, CATEGORY_HEADERS);
}

function createStore_(payload) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.stores, STORE_HEADERS);
  const item = {
    id: resolveRowId_(sheet, STORE_HEADERS, payload.id),
    name: payload.name || "",
    logo_path: payload.logo_path || "",
    updated_at: new Date().toISOString(),
  };
  appendRecord_(sheet, STORE_HEADERS, item);
  return item;
}

function updateStore_(payload) {
  return updateRow_(SHEET_NAMES.stores, STORE_HEADERS, payload);
}

function deleteStore_(payload) {
  return deleteRow_(SHEET_NAMES.stores, STORE_HEADERS, payload);
}

function createCategory_(payload) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.categories, CATEGORY_HEADERS);
  const item = {
    id: resolveRowId_(sheet, CATEGORY_HEADERS, payload.id),
    name: payload.name || "",
    updated_at: new Date().toISOString(),
  };
  appendRecord_(sheet, CATEGORY_HEADERS, item);
  return item;
}

function updateCategory_(payload) {
  return updateRow_(SHEET_NAMES.categories, CATEGORY_HEADERS, payload);
}

function deleteCategory_(payload) {
  return deleteRow_(SHEET_NAMES.categories, CATEGORY_HEADERS, payload);
}

function updateRow_(sheetName, headers, payload) {
  return updateSheetRecord_(sheetName, headers, payload, "Record not found.");
}

function deleteRow_(sheetName, headers, payload) {
  return deleteSheetRecord_(sheetName, headers, payload, "Record not found.");
}

function getPath_(e) {
  return (e && e.parameter && e.parameter.path) || "/";
}

function getOrCreateSheet_(name, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else if (headers && headers.length) {
    ensureSheetHeaders_(sheet, headers);
  }

  return sheet;
}

function ensureSheetHeaders_(sheet, headers) {
  var existingHeaders = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  var missingHeaders = headers.filter(function (header) {
    return existingHeaders.indexOf(header) === -1;
  });

  if (!missingHeaders.length) {
    return;
  }

  sheet
    .getRange(1, existingHeaders.length + 1, 1, missingHeaders.length)
    .setValues([missingHeaders]);
}

function getRows_(name, headers) {
  const sheet = getOrCreateSheet_(name, headers);
  return mapRowsFromValues_(getSheetValues_(sheet));
}

function rewriteSheetBody_(sheet, headers, rows) {
  var maxRows = sheet.getMaxRows();
  var numColumns = headers.length;
  var bodyRowCount = Math.max(sheet.getLastRow() - 1, 0);

  if (bodyRowCount > 0) {
    sheet.getRange(2, 1, bodyRowCount, numColumns).clearContent();
  }

  if (rows.length) {
    if (maxRows < rows.length + 1) {
      sheet.insertRowsAfter(maxRows, rows.length + 1 - maxRows);
    }

    sheet.getRange(2, 1, rows.length, numColumns).setValues(rows);
  }
}

function resolveRowId_(sheet, headers, candidateId) {
  var normalizedId = normalizeRowId_(candidateId);
  if (normalizedId !== "") {
    return normalizedId;
  }

  var values = getSheetValues_(sheet);
  return getNextNumericId_(values, values[0] || headers);
}

function normalizeRowId_(value) {
  if (value === "" || value == null) {
    return "";
  }

  var strValue = String(value).trim();
  // If not a number, consider it invalid so server generates a numeric one
  if (strValue === "" || isNaN(Number(strValue))) {
    return "";
  }

  return strValue;
}

function getNextNumericId_(values, headers) {
  var idIndex = headers.indexOf("id");

  if (idIndex === -1) {
    throw new Error('Sheet is missing required "id" column.');
  }

  var maxId = 0;

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var numericId = Number(values[rowIndex][idIndex]);
    if (Number.isFinite(numericId)) {
      maxId = Math.max(maxId, numericId);
    }
  }

  return maxId + 1;
}

function normalizeNumericId_(value) {
  if (value === "" || value == null) {
    return "";
  }

  var numericId = Number(value);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return "";
  }

  return Math.floor(numericId);
}

function handleRequest_(routes, e, payload) {
  try {
    var path = getPath_(e);
    var handler = routes[path];

    if (!handler) {
      return jsonResponse_({ success: false, message: "Route not found." });
    }

    var response = handler(e, payload);
    if (response && response.conflict) {
       return jsonResponse_({ success: false, conflict: true, message: "Conflict detected: remote data has been updated by another device.", ...response });
    }
    return jsonResponse_(response);
  } catch (error) {
    return jsonResponse_({ success: false, message: error.message });
  }
}

function parseRequestPayload_(e) {
  return JSON.parse((e.postData && e.postData.contents) || "{}");
}

function getSheetValues_(sheet) {
  return sheet.getDataRange().getValues();
}

function mapRowsFromValues_(values) {
  if (values.length <= 1) {
    return [];
  }

  var headers = values[0];
  return values.slice(1).map(function (row) {
    return mapRowToObject_(headers, row);
  });
}

function mapRowToObject_(headers, row) {
  var item = {};
  headers.forEach(function (header, index) {
    item[header] = row[index];
  });
  return item;
}

function toOrderedRow_(headers, record) {
  return headers.map(function (header) {
    return record[header] != null ? record[header] : "";
  });
}

function appendRecord_(sheet, headers, record) {
  var values = getSheetValues_(sheet);
  var sheetHeaders = values[0] && values[0].length ? values[0] : headers;
  sheet.appendRow(toOrderedRow_(sheetHeaders, record));
}

function getNextSheetId_(sheetName, headers) {
  var sheet = getOrCreateSheet_(sheetName, headers);
  var values = getSheetValues_(sheet);
  return getNextNumericId_(values, values[0] || headers);
}

function resolveSequentialId_(candidateId, createId) {
  var normalizedId = normalizeRowId_(candidateId);
  return normalizedId !== "" ? normalizedId : createId();
}

function resolveTripTextField_(value, fallback) {
  return value != null ? value : fallback || "";
}

function normalizeElapsedMs_(value, fallback) {
  if (value === "") {
    return "";
  }

  if (value != null) {
    var numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.max(0, numericValue) : "";
  }

  if (fallback === "") {
    return "";
  }

  if (fallback != null) {
    var numericFallback = Number(fallback);
    return Number.isFinite(numericFallback) ? Math.max(0, numericFallback) : "";
  }

  return "";
}

function buildTripRecord_(payload, existingTrip) {
  var trip = existingTrip || {};

  return {
    id: payload.id != null ? payload.id : trip.id,
    name: payload.name != null ? payload.name : trip.name || "",
    planned_for:
      payload.planned_for ||
      trip.planned_for ||
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd",
      ),
    budget: Number(payload.budget != null ? payload.budget : trip.budget || 0),
    status: payload.status != null ? payload.status : trip.status || "planned",
    store_id: payload.store_id != null ? payload.store_id : trip.store_id || "",
    note: payload.note != null ? payload.note : trip.note || "",
    created_at: resolveTripTextField_(payload.created_at, trip.created_at || new Date().toISOString()),
    updated_at: new Date().toISOString(),
    started_at: resolveTripTextField_(payload.started_at, trip.started_at || ""),
    elapsed_ms: normalizeElapsedMs_(payload.elapsed_ms, trip.elapsed_ms || ""),
    completed_at:
      payload.completed_at != null
        ? payload.completed_at
      : trip.completed_at || "",
    archived_at:
      payload.archived_at != null ? payload.archived_at : trip.archived_at || "",
  };
}

function buildTripChecklistItem_(item, defaults) {
  var base = defaults || {};

  return {
    id: base.id != null ? base.id : item.id,
    trip_id: base.trip_id != null ? base.trip_id : item.trip_id || "",
    inventory_item_id: item.inventory_item_id || "",
    item_name: item.item_name || "",
    category_id: item.category_id || "",
    quantity: Math.max(1, Number(item.quantity || 1)),
    planned_price:
      item.planned_price === "" || item.planned_price == null
        ? ""
        : Number(item.planned_price),
    actual_price:
      item.actual_price === "" || item.actual_price == null
        ? ""
        : Number(item.actual_price),
    is_purchased: item.is_purchased === true || item.is_purchased === "true",
    is_unplanned: item.is_unplanned === true || item.is_unplanned === "true",
    is_ad_hoc: item.is_ad_hoc === true || item.is_ad_hoc === "true",
    barcode: item.barcode || "",
    sort_order: Number(
      item.sort_order != null ? item.sort_order : base.sort_order != null ? base.sort_order : 0,
    ),
    created_at: item.created_at || new Date().toISOString(),
  };
}

function buildInventoryItemRecord_(payload, existingItem) {
  var item = existingItem || {};

  return {
    id: payload.id != null ? payload.id : item.id,
    name: payload.name != null ? payload.name : item.name || "",
    category_id:
      payload.category_id != null ? payload.category_id : item.category_id || "",
    usual_price:
      payload.usual_price === "" || payload.usual_price == null
        ? 0
        : Number(payload.usual_price),
    barcode: payload.barcode != null ? payload.barcode : item.barcode || "",
    has_no_barcode:
      payload.has_no_barcode != null
        ? payload.has_no_barcode === true || payload.has_no_barcode === "true"
        : item.has_no_barcode === true || item.has_no_barcode === "true",
    created_at: payload.created_at || item.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function updateSheetRecord_(sheetName, headers, payload, notFoundMessage, buildRecord) {
  if (!payload.id) {
    throw new Error("ID is required for update.");
  }

  var sheet = getOrCreateSheet_(sheetName, headers);
  var values = getSheetValues_(sheet);
  var sheetHeaders = values[0] || headers;
  var rowMatch = findRowById_(values, payload.id);

  if (!rowMatch) {
    throw new Error(notFoundMessage || "Record not found.");
  }

  var existingRecord = mapRowToObject_(sheetHeaders, rowMatch.row);
  
  if (payload.base_updated_at && String(existingRecord.updated_at) !== String(payload.base_updated_at)) {
     return { success: false, conflict: true, remote_item: existingRecord };
  }

  var updatedRecord = buildRecord
    ? buildRecord(payload, existingRecord)
    : { ...existingRecord, ...payload };

  sheet
    .getRange(rowMatch.rowIndex + 1, 1, 1, sheetHeaders.length)
    .setValues([toOrderedRow_(sheetHeaders, updatedRecord)]);

  return updatedRecord;
}

function deleteSheetRecord_(sheetName, headers, payload, notFoundMessage) {
  if (!payload.id) {
    throw new Error("ID is required for deletion.");
  }

  var sheet = getOrCreateSheet_(sheetName, headers);
  var values = getSheetValues_(sheet);
  var rowMatch = findRowById_(values, payload.id);

  if (!rowMatch) {
    throw new Error(notFoundMessage || "Record not found.");
  }

  var existingRecord = mapRowToObject_(values[0], rowMatch.row);
  if (payload.base_updated_at && String(existingRecord.updated_at) !== String(payload.base_updated_at)) {
     return { success: false, conflict: true, remote_item: existingRecord };
  }

  sheet.deleteRow(rowMatch.rowIndex + 1);
  return payload.id;
}

function findRowById_(values, id) {
  if (values.length <= 1) {
    return null;
  }

  var idIndex = values[0].indexOf("id");

  if (idIndex === -1) {
    throw new Error('Sheet is missing required "id" column.');
  }

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][idIndex]) === String(id)) {
      return {
        rowIndex: rowIndex,
        row: values[rowIndex],
      };
    }
  }

  return null;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
