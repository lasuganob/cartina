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
  "created_at",
];

function doGet(e) {
  try {
    const path = getPath_(e);

    if (path === "/trips") {
      return jsonResponse_({
        success: true,
        items: getTrips_(),
        trip_checklist: getTripChecklist_(),
        inventory_items: getInventoryItems_(),
        stores: getStores_(),
        categories: getCategories_(),
      });
    }

    return jsonResponse_({ success: false, message: "Route not found." });
  } catch (error) {
    return jsonResponse_({ success: false, message: error.message });
  }
}

function doPost(e) {
  try {
    const path = getPath_(e);
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");

    if (path === "/trips") {
      return jsonResponse_({
        success: true,
        item: createTrip_(payload),
      });
    }

    if (path === "/trips/update") {
      return jsonResponse_({
        success: true,
        item: updateTrip_(payload),
      });
    }

    if (path === "/trip-checklist/replace") {
      return jsonResponse_({
        success: true,
        items: replaceTripChecklist_(payload),
      });
    }

    if (path === "/inventory-items") {
      return jsonResponse_({
        success: true,
        item: createInventoryItem_(payload),
      });
    }

    if (path === "/inventory-items/update") {
      return jsonResponse_({
        success: true,
        item: updateInventoryItem_(payload),
      });
    }

    if (path === "/inventory-items/delete") {
      return jsonResponse_({
        success: true,
        id: deleteInventoryItem_(payload),
      });
    }

    return jsonResponse_({ success: false, message: "Route not found." });
  } catch (error) {
    return jsonResponse_({ success: false, message: error.message });
  }
}

function getTrips_() {
  const sheet = getOrCreateSheet_(SHEET_NAMES.trips, TRIP_HEADERS);
  const values = sheet.getDataRange().getValues();

  if (values.length === 1) {
    return [];
  }

  const headers = values[0];
  return values.slice(1).map(function (row) {
    var item = {};
    headers.forEach(function (header, index) {
      item[header] = row[index];
    });
    return item;
  });
}

function createTrip_(payload) {
  const headers = TRIP_HEADERS;
  const sheet = getOrCreateSheet_(SHEET_NAMES.trips, headers);

  const budget = Number(payload.budget || 0);
  const trip = {
    id: resolveRowId_(sheet, headers, payload.id),
    name: payload.name || "",
    planned_for:
      payload.planned_for ||
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd",
      ),
    budget: budget,
    status: payload.status || "planned",
    store_id: payload.store_id || "",
    note: payload.note || "",
    created_at: payload.created_at || new Date().toISOString(),
    started_at: payload.started_at || "",
    elapsed_ms: Math.max(0, Number(payload.elapsed_ms || 0)),
    completed_at: payload.completed_at || "",
    archived_at: payload.archived_at || "",
  };

  sheet.appendRow([
    trip.id,
    trip.name,
    trip.planned_for,
    trip.budget,
    trip.status,
    trip.store_id,
    trip.note,
    trip.created_at,
    trip.started_at,
    trip.elapsed_ms,
    trip.completed_at,
    trip.archived_at,
  ]);

  return trip;
}

function updateTrip_(payload) {
  if (!payload.id) {
    throw new Error("Trip id is required.");
  }

  const sheet = getOrCreateSheet_(SHEET_NAMES.trips, [
    "id",
    "name",
    "planned_for",
    "budget",
    "status",
    "store_id",
    "note",
    "created_at",
    "started_at",
    "elapsed_ms",
    "completed_at",
    "archived_at",
  ]);
  const values = sheet.getDataRange().getValues();

  if (values.length === 1) {
    throw new Error("Trip not found.");
  }

  const headers = values[0];
  const idIndex = headers.indexOf("id");

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][idIndex]) === String(payload.id)) {
      const existingTrip = {};

      headers.forEach(function (header, index) {
        existingTrip[header] = values[rowIndex][index];
      });

      const updatedTrip = {
        ...existingTrip,
        ...payload,
        budget: Number(
          payload.budget != null ? payload.budget : existingTrip.budget || 0,
        ),
        elapsed_ms: Math.max(
          0,
          Number(
            payload.elapsed_ms != null
              ? payload.elapsed_ms
              : existingTrip.elapsed_ms || 0,
          ),
        ),
        note: payload.note != null ? payload.note : existingTrip.note || "",
      };

      const orderedRow = headers.map(function (header) {
        return updatedTrip[header] != null ? updatedTrip[header] : "";
      });

      sheet
        .getRange(rowIndex + 1, 1, 1, orderedRow.length)
        .setValues([orderedRow]);

      return updatedTrip;
    }
  }

  throw new Error("Trip not found.");
}

function getTripChecklist_() {
  return getRows_(SHEET_NAMES.tripChecklist, [
    "id",
    "trip_id",
    "inventory_item_id",
    "item_name",
    "quantity",
    "planned_price",
    "actual_price",
    "is_purchased",
    "is_unplanned",
    "barcode",
    "sort_order",
    "created_at",
  ]);
}

function replaceTripChecklist_(payload) {
  if (!payload.trip_id) {
    throw new Error("trip_id is required.");
  }

  var items = Array.isArray(payload.items) ? payload.items : [];
  var headers = [
    "id",
    "trip_id",
    "inventory_item_id",
    "item_name",
    "quantity",
    "planned_price",
    "actual_price",
    "is_purchased",
    "is_unplanned",
    "barcode",
    "sort_order",
    "created_at",
  ];
  var sheet = getOrCreateSheet_(SHEET_NAMES.tripChecklist, headers);
  var values = sheet.getDataRange().getValues();
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
    var resolvedId = normalizeNumericId_(item.id);
    if (resolvedId === "") {
      resolvedId = nextId;
      nextId += 1;
    }

    return {
      id: resolvedId,
      trip_id: payload.trip_id,
      inventory_item_id: item.inventory_item_id || "",
      item_name: item.item_name || "",
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
      barcode: item.barcode || "",
      sort_order: Number(item.sort_order != null ? item.sort_order : index),
      created_at: item.created_at || new Date().toISOString(),
    };
  });

  var rows = normalizedItems.map(function (item) {
    return [
      item.id,
      item.trip_id,
      item.inventory_item_id,
      item.item_name,
      item.quantity,
      item.planned_price,
      item.actual_price,
      item.is_purchased,
      item.is_unplanned,
      item.barcode,
      item.sort_order,
      item.created_at,
    ];
  });
  rewriteSheetBody_(sheet, headers, preservedRows.concat(rows));

  return normalizedItems;
}

function getInventoryItems_() {
  return getRows_(SHEET_NAMES.inventoryItems, INVENTORY_HEADERS);
}

function createInventoryItem_(payload) {
  const headers = INVENTORY_HEADERS;
  const sheet = getOrCreateSheet_(SHEET_NAMES.inventoryItems, headers);

  const item = {
    id: resolveRowId_(sheet, headers, payload.id),
    name: payload.name || "",
    category_id: payload.category_id || "",
    usual_price:
      payload.usual_price === "" || payload.usual_price == null
        ? 0
        : Number(payload.usual_price),
    barcode: payload.barcode || "",
    created_at: payload.created_at || new Date().toISOString(),
  };

  sheet.appendRow([
    item.id,
    item.name,
    item.category_id,
    item.usual_price,
    item.barcode,
    item.created_at,
  ]);

  return item;
}

function updateInventoryItem_(payload) {
  if (!payload.id) {
    throw new Error("Inventory item id is required.");
  }

  const sheet = getOrCreateSheet_(SHEET_NAMES.inventoryItems, INVENTORY_HEADERS);
  const values = sheet.getDataRange().getValues();

  if (values.length === 1) {
    throw new Error("Inventory item not found.");
  }

  const headers = values[0];
  const idIndex = headers.indexOf("id");

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][idIndex]) === String(payload.id)) {
      const existingItem = {};

      headers.forEach(function (header, index) {
        existingItem[header] = values[rowIndex][index];
      });

      const updatedItem = {
        ...existingItem,
        ...payload,
        name: payload.name != null ? payload.name : existingItem.name || "",
        category_id:
          payload.category_id != null
            ? payload.category_id
            : existingItem.category_id || "",
        usual_price:
          payload.usual_price === "" || payload.usual_price == null
            ? 0
            : Number(payload.usual_price),
        barcode: payload.barcode != null ? payload.barcode : existingItem.barcode || "",
        created_at: payload.created_at || existingItem.created_at || new Date().toISOString(),
      };

      const orderedRow = headers.map(function (header) {
        return updatedItem[header] != null ? updatedItem[header] : "";
      });

      sheet
        .getRange(rowIndex + 1, 1, 1, orderedRow.length)
        .setValues([orderedRow]);

      return updatedItem;
    }
  }

  throw new Error("Inventory item not found.");
}

function deleteInventoryItem_(payload) {
  if (!payload.id) {
    throw new Error("Inventory item id is required.");
  }

  const sheet = getOrCreateSheet_(SHEET_NAMES.inventoryItems, INVENTORY_HEADERS);
  const values = sheet.getDataRange().getValues();

  if (values.length === 1) {
    throw new Error("Inventory item not found.");
  }

  const headers = values[0];
  const idIndex = headers.indexOf("id");

  for (var rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    if (String(values[rowIndex][idIndex]) === String(payload.id)) {
      sheet.deleteRow(rowIndex + 1);
      return payload.id;
    }
  }

  throw new Error("Inventory item not found.");
}

function getStores_() {
  return getRows_(SHEET_NAMES.stores, ["id", "name", "logo_path"]);
}

function getCategories_() {
  return getRows_(SHEET_NAMES.categories, ["id", "name"]);
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
  const values = sheet.getDataRange().getValues();

  if (values.length === 1) {
    return [];
  }

  const rowHeaders = values[0];
  return values.slice(1).map(function (row) {
    var item = {};
    rowHeaders.forEach(function (header, index) {
      item[header] = row[index];
    });
    return item;
  });
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
  var normalizedId = normalizeNumericId_(candidateId);

  if (normalizedId !== "") {
    return normalizedId;
  }

  var values = sheet.getDataRange().getValues();
  return getNextNumericId_(values, headers);
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

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
