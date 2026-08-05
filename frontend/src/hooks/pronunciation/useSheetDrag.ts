import { useCallback, useRef, useState } from "react";

/** Drag past this many pixels and the sheet closes on release. */
const DISMISS_DISTANCE_PX = 96;

/** A quick downward flick closes the sheet even if it never reached the distance. */
const DISMISS_VELOCITY_PX_PER_MS = 0.5;

type SheetDrag = {
  /** Spread onto the grab handle. */
  handleProps: {
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onPointerCancel: (event: React.PointerEvent) => void;
  };
  /** Spread onto the sheet panel. */
  panelStyle: React.CSSProperties;
};

/**
 * Lets the bottom sheet be dismissed by dragging its handle downwards.
 *
 * The panel follows the pointer while dragging and either springs back or
 * closes on release. Only downward movement is tracked: dragging up would
 * detach the sheet from the bottom of the screen.
 */
export function useSheetDrag(onDismiss: () => void): SheetDrag {
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startYRef = useRef(0);
  const startTimeRef = useRef(0);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    startYRef.current = event.clientY;
    startTimeRef.current = performance.now();
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!isDragging) {
        return;
      }

      setOffsetY(Math.max(0, event.clientY - startYRef.current));
    },
    [isDragging],
  );

  const finishDrag = useCallback(
    (event: React.PointerEvent) => {
      if (!isDragging) {
        return;
      }

      event.currentTarget.releasePointerCapture(event.pointerId);
      setIsDragging(false);

      const distance = Math.max(0, event.clientY - startYRef.current);
      const elapsed = performance.now() - startTimeRef.current;
      const velocity = elapsed > 0 ? distance / elapsed : 0;

      const shouldDismiss =
        distance >= DISMISS_DISTANCE_PX ||
        velocity >= DISMISS_VELOCITY_PX_PER_MS;

      // Reset before dismissing so a reopened sheet starts at rest rather than
      // wherever this drag ended.
      setOffsetY(0);

      if (shouldDismiss) {
        onDismiss();
      }
    },
    [isDragging, onDismiss],
  );

  return {
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
    },
    panelStyle: {
      transform: offsetY > 0 ? `translateY(${offsetY}px)` : undefined,
      // No transition while the finger is down, so the panel tracks it exactly.
      transition: isDragging ? undefined : "transform 200ms ease-out",
      // Stops the browser from claiming the gesture as a scroll or a
      // pull-to-refresh before the pointer handlers see it.
      touchAction: "none",
    },
  };
}
