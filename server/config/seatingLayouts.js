
const SCREEN_LAYOUTS = {
  "layout-1": {
    name: "Central Aisle",
    seatsPerRow: 20,
    aisleAfter: [10],
    sections: 2,
    premiumRows: 3,
    reclinerRows: 2,
  },

  "layout-2": {
    name: "Twin Aisles",
    seatsPerRow: 16,
    aisleAfter: [5, 11],
    sections: 3,
    premiumRows: 3,
    reclinerRows: 2,
  },

  "layout-3": {
    name: "Wide Centre Block",
    seatsPerRow: 20,
    aisleAfter: [6, 14],
    sections: 3,
    premiumRows: 4,
    reclinerRows: 2,
  },

  "layout-4": {
    name: "Luxury Auditorium",
    seatsPerRow: 24,
    aisleAfter: [8, 16],
    sections: 3,
    premiumRows: 4,
    reclinerRows: 4,
  },
};

// Convert row numbers into cinema row labels.
// 1 = A, 26 = Z, 27 = AA.
const getRowLabel = (rowNumber) => {
  let number = rowNumber;
  let label = "";

  while (number > 0) {
    number--;

    label =
      String.fromCharCode(65 + (number % 26)) + label;

    number = Math.floor(number / 26);
  }

  return label;
};

// Determine seat category using the row position.
const getSeatCategory = (
  rowNumber,
  totalRows,
  layout
) => {
  const reclinerStart =
    totalRows - layout.reclinerRows + 1;

  const premiumStart =
    totalRows - layout.reclinerRows -
    layout.premiumRows + 1;

  if (
    layout.reclinerRows > 0 &&
    rowNumber >= reclinerStart
  ) {
    return "recliner";
  }

  if (
    layout.premiumRows > 0 &&
    rowNumber >= premiumStart
  ) {
    return "premium";
  }

  return "regular";
};

// Generate seat inventory for a fixed layout.
const generateSeats = ({
  layoutId,
  totalSeats,
  ticketPrices = {},
}) => {
  const layout = SCREEN_LAYOUTS[layoutId];

  if (!layout) {
    throw new Error(`Invalid seating layout: ${layoutId}`);
  }

  const capacity = Number(totalSeats);

  if (
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > 2000
  ) {
    throw new Error(
      "Seat capacity must be a whole number between 1 and 2000."
    );
  }

  const totalRows = Math.ceil(
    capacity / layout.seatsPerRow
  );

  const seats = [];

  let generatedCount = 0;

  for (
    let rowNumber = 1;
    rowNumber <= totalRows;
    rowNumber++
  ) {
    const rowLabel = getRowLabel(rowNumber);

    const seatsInThisRow = Math.min(
      layout.seatsPerRow,
      capacity - generatedCount
    );

    for (
      let seatNumber = 1;
      seatNumber <= seatsInThisRow;
      seatNumber++
    ) {
      const category = getSeatCategory(
        rowNumber,
        totalRows,
        layout
      );

      const aisleCount = layout.aisleAfter.filter(
        (position) => seatNumber > position
      ).length;

      const columnNumber =
        seatNumber + aisleCount;

      const seatLabel =
        `${rowLabel}${String(seatNumber).padStart(2, "0")}`;

      seats.push({
        seatId: `${layoutId}-${rowLabel}-${String(
          seatNumber
        ).padStart(2, "0")}`,

        seatLabel,
        row: rowLabel,
        rowNumber,
        seatNumber,
        columnNumber,
        category,

        price: Number(
          ticketPrices[category] ?? 0
        ),

        status: "available",
      });

      generatedCount++;
    }
  }

  return {
    layoutId,
    layoutName: layout.name,
    totalSeats: seats.length,
    totalRows,
    seats,
  };
};

module.exports = {
  SCREEN_LAYOUTS,
  getRowLabel,
  generateSeats,
};
