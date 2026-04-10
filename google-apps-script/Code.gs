const SHEET_NAMES = {
  trips: "Trips",
  tripChecklist: "trip_checklist",
  inventoryItems: "inventory_items",
  stores: "stores",
  categories: "categories",
};

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

    return jsonResponse_({ success: false, message: "Route not found." });
  } catch (error) {
    return jsonResponse_({ success: false, message: error.message });
  }
}

function getTrips_() {
  const sheet = getOrCreateSheet_(SHEET_NAMES.trips, [
    "id",
    "name",
    "planned_for",
    "budget",
    "status",
    "store_id",
    "note",
    "created_at",
    "completed_at",
  ]);
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
  const headers = [
    "id",
    "name",
    "planned_for",
    "budget",
    "status",
    "store_id",
    "note",
    "created_at",
    "completed_at",
  ];
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
    completed_at: payload.completed_at || "",
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
    trip.completed_at,
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
    "completed_at",
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
        budget: Number(payload.budget != null ? payload.budget : existingTrip.budget || 0),
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
    "sort_order",
    "created_at",
  ];
  var sheet = getOrCreateSheet_(SHEET_NAMES.tripChecklist, headers);
  var values = sheet.getDataRange().getValues();
  headers = values[0];
  var tripIdIndex = headers.indexOf("trip_id");
  var nextId = getNextNumericId_(values, headers);

  for (var rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    if (String(values[rowIndex][tripIdIndex]) === String(payload.trip_id)) {
      sheet.deleteRow(rowIndex + 1);
    }
  }

  if (!items.length) {
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
      item.sort_order,
      item.created_at,
    ];
  });

  sheet
    .getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length)
    .setValues(rows);

  return normalizedItems;
}

function getInventoryItems_() {
  return getRows_(SHEET_NAMES.inventoryItems, [
    "id",
    "name",
    "category_id",
    "usual_price",
    "created_at",
  ]);
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
  }

  return sheet;
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
