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

  const budget = Number(payload.budget || 0);
  const trip = {
    id: payload.id || Utilities.getUuid(),
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
    "planned_price",
    "actual_price",
    "is_purchased",
    "is_unplanned",
    "sort_order",
    "created_at",
  ]);
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

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
