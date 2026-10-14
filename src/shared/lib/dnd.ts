import type { Modifier } from "@dnd-kit/core";

/** Locks drag movement to the vertical axis (sortable lists). */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
