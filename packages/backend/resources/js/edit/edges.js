// Rects from getBoundingClientRect() are measured from the left of the
// viewport, while the bar runs in the direction of the backend (decision
// 0133). These turn them into distances for inset-inline-start and
// inset-inline-end of an element in the bar, which fills the viewport.

const rtl = (bar) => bar.dir === 'rtl';

/** How far the end of a rect lies from the start of a line in the bar. */
export const endFromStart = (bar, rect) => (rtl(bar) ? bar.clientWidth - rect.left : rect.right);

/** How far the end of a rect lies from the end of a line in the bar, at least 0. */
export const endFromEnd = (bar, rect) => Math.max(0, rtl(bar) ? rect.left : bar.clientWidth - rect.right);

/** How far a point measured from the left lies from the start of a line in the bar. */
export const fromStart = (bar, x) => (rtl(bar) ? bar.clientWidth - x : x);
