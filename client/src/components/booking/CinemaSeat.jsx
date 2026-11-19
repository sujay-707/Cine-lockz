
import React from "react";
import "./CinemaSeat.css";

const seatColors = {
  available: {
    back: "#065F46",
    cushion: "#10B981",
    arm: "#064E3B",
    base: "#0B0B0D",
    stroke: "#FFFFFF",
  },

  selected: {
    back: "#A16207",
    cushion: "#EAB308",
    arm: "#854D0E",
    base: "#0B0B0D",
    stroke: "#FFFFFF",
  },

  locked: {
    back: "#991B1B",
    cushion: "#EF4444",
    arm: "#7F1D1D",
    base: "#0B0B0D",
    stroke: "#FFFFFF",
  },

  booked: {
    back: "#393940",
    cushion: "#55555D",
    arm: "#2E2E34",
    base: "#0B0B0D",
    stroke: "#A1A1AA",
  },
};

function CinemaSeat({
  seat,
  status = "available",
  selected = false,
  onClick,
  disabled = false,
  size = 48,
}) {
  const currentStatus = selected ? "selected" : status;

  const colors =
    seatColors[currentStatus] || seatColors.available;

  const isDisabled =
    disabled ||
    currentStatus === "booked" ||
    currentStatus === "locked";

  const seatLabel = seat?.label || seat?.seatLabel || "";

  return (
    <button
      type="button"
      className={`cinema-seat cinema-seat--${currentStatus}`}
      onClick={() => {
        if (!isDisabled) {
          onClick?.(seat);
        }
      }}
      disabled={isDisabled}
      aria-label={`Seat ${seatLabel}, ${currentStatus}`}
      aria-pressed={selected}
      title={`Seat ${seatLabel} - ${currentStatus}`}
      style={{
        width: size,
        height: size + 8,
      }}
    >
      <svg
        viewBox="0 0 64 72"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Seat backrest */}
        <path
          d="M13 9 Q13 3 20 3 H44 Q51 3 51 9 L54 36 Q54 42 48 43 H16 Q10 42 10 36 Z"
          fill={colors.back}
          stroke={colors.stroke}
          strokeWidth="1.5"
        />

        {/* Backrest cushion */}
        <path
          d="M18 10 Q18 7 22 7 H42 Q46 7 46 10 L48 32 Q48 36 44 37 H20 Q16 36 16 32 Z"
          fill={colors.cushion}
        />

        {/* Backrest stitching */}
        <path
          d="M21 12 Q32 8 43 12"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.5"
          strokeWidth="1"
        />

        {/* Left armrest */}
        <path
          d="M7 31 Q4 30 4 35 V47 Q4 51 9 51 H16 V39 H12 Q9 39 9 36 Z"
          fill={colors.arm}
          stroke={colors.stroke}
          strokeWidth="1"
        />

        {/* Right armrest */}
        <path
          d="M57 31 Q60 30 60 35 V47 Q60 51 55 51 H48 V39 H52 Q55 39 55 36 Z"
          fill={colors.arm}
          stroke={colors.stroke}
          strokeWidth="1"
        />

        {/* Seat cushion */}
        <path
          d="M12 39 Q12 35 17 35 H47 Q52 35 52 39 L50 49 Q49 53 44 53 H20 Q15 53 14 49 Z"
          fill={colors.cushion}
          stroke={colors.stroke}
          strokeWidth="1.3"
        />

        {/* Cushion highlight */}
        <path
          d="M19 40 Q32 36 45 40"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.45"
          strokeWidth="1"
        />

        {/* Pedestal */}
        <path
          d="M28 53 H36 L38 64 H26 Z"
          fill={colors.base}
          stroke={colors.stroke}
          strokeWidth="0.8"
        />

        {/* Base plate */}
        <path
          d="M19 64 H45 L49 68 H15 Z"
          fill={colors.base}
          stroke={colors.stroke}
          strokeWidth="1"
        />

        {/* Popcorn detail */}
        <g transform="translate(44 3)">
          <path
            d="M1 9 L3 18 H11 L13 9 Z"
            fill="#FFFFFF"
            stroke="#0B0B0D"
            strokeWidth="0.8"
          />

          <circle cx="4" cy="7" r="3" fill="#FFFFFF" />
          <circle cx="8" cy="5" r="3" fill="#FFFFFF" />
          <circle cx="11" cy="8" r="3" fill="#FFFFFF" />
        </g>

        {/* Lock indicator */}
        {currentStatus === "locked" && (
          <g transform="translate(43 45)">
            <rect
              x="0"
              y="4"
              width="13"
              height="11"
              rx="2"
              fill="#EF4444"
              stroke="#FFFFFF"
              strokeWidth="1"
            />

            <path
              d="M3 4 V2 A3.5 3.5 0 0 1 10 2 V4"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
    </button>
  );
}

export default CinemaSeat;
