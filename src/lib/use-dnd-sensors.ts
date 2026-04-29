import { PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

// Shared DnD activation thresholds:
// - PointerSensor distance:8 keeps clicks-as-drags from firing on slow taps.
// - TouchSensor delay:200/tolerance:5 lets users scroll the page without
//   accidentally starting a drag from a row.
export function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );
}
