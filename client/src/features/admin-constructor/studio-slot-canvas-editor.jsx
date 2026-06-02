import React, { useEffect } from "react";
import { previewStoneStyle } from "../../jewelry-preview";

export function StudioSlotCanvasEditor({
  baseAssetUrl,
  slots,
  stones,
  previewSelections,
  selectedSlotId,
  onSelectSlot,
  onMoveSlot,
  onResizeSlot,
  onRotateSlot,
  onInteractionStart,
  onInteractionEnd
}) {
  const boardRef = React.useRef(null);
  const dragStateRef = React.useRef(null);
  const boardRectRef = React.useRef(null);
  const pendingFrameRef = React.useRef(null);
  const latestPointerEventRef = React.useRef(null);
  const latestMoveRef = React.useRef(onMoveSlot);
  const latestResizeRef = React.useRef(onResizeSlot);
  const latestRotateRef = React.useRef(onRotateSlot);
  const latestInteractionStartRef = React.useRef(onInteractionStart);
  const latestInteractionEndRef = React.useRef(onInteractionEnd);

  useEffect(() => {
    latestMoveRef.current = onMoveSlot;
    latestResizeRef.current = onResizeSlot;
    latestRotateRef.current = onRotateSlot;
    latestInteractionStartRef.current = onInteractionStart;
    latestInteractionEndRef.current = onInteractionEnd;
  }, [onMoveSlot, onResizeSlot, onRotateSlot, onInteractionStart, onInteractionEnd]);

  useEffect(() => () => {
    if (pendingFrameRef.current) {
      window.cancelAnimationFrame(pendingFrameRef.current);
    }
  }, []);

  function applyDragUpdate(activeDragState, pointerPoint) {
    const rect = boardRectRef.current;
    if (!rect || !activeDragState || !pointerPoint) return;
    if (activeDragState.mode === "move") {
      const x = Math.max(0, Math.min(100, ((pointerPoint.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((pointerPoint.clientY - rect.top) / rect.height) * 100));
      latestMoveRef.current?.(activeDragState.slotId, { x, y });
      return;
    }
    if (activeDragState.mode === "resize") {
      const deltaX = (pointerPoint.clientX - activeDragState.startClientX) / rect.width;
      const deltaY = (pointerPoint.clientY - activeDragState.startClientY) / rect.height;
      const nextScaleX = Math.max(0.35, Math.min(3, activeDragState.startScaleX + deltaX * 3));
      const nextScaleY = Math.max(0.35, Math.min(3, activeDragState.startScaleY + deltaY * 3));
      latestResizeRef.current?.(activeDragState.slotId, {
        scale_x: Number(nextScaleX.toFixed(2)),
        scale_y: Number(nextScaleY.toFixed(2))
      });
      return;
    }
    if (activeDragState.mode === "rotate") {
      const centerX = rect.left + (activeDragState.centerX / 100) * rect.width;
      const centerY = rect.top + (activeDragState.centerY / 100) * rect.height;
      const angle = Math.atan2(pointerPoint.clientY - centerY, pointerPoint.clientX - centerX) * (180 / Math.PI);
      const nextRotation = ((angle + 90) % 360 + 360) % 360;
      latestRotateRef.current?.(activeDragState.slotId, { rotation_deg: Number(nextRotation.toFixed(1)) });
    }
  }

  function scheduleDragUpdate(event) {
    latestPointerEventRef.current = { clientX: event.clientX, clientY: event.clientY };
    if (pendingFrameRef.current) return;
    pendingFrameRef.current = window.requestAnimationFrame(() => {
      pendingFrameRef.current = null;
      applyDragUpdate(dragStateRef.current, latestPointerEventRef.current);
    });
  }

  function beginDrag(event, slot, mode, extraState = {}) {
    event.preventDefault();
    event.stopPropagation();
    const board = boardRef.current;
    if (!board) return;
    onSelectSlot(slot.id);
    latestInteractionStartRef.current?.();
    boardRectRef.current = board.getBoundingClientRect();
    dragStateRef.current = {
      mode,
      slotId: slot.id,
      pointerId: event.pointerId,
      ...extraState
    };
    latestPointerEventRef.current = { clientX: event.clientX, clientY: event.clientY };
    board.setPointerCapture?.(event.pointerId);
    applyDragUpdate(dragStateRef.current, latestPointerEventRef.current);
  }

  function handlePointerMove(event) {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    scheduleDragUpdate(event);
  }

  function handlePointerUp(event) {
    const finalDragState = dragStateRef.current;
    if (!finalDragState || finalDragState.pointerId !== event.pointerId) return;
    event.preventDefault();
    if (pendingFrameRef.current) {
      window.cancelAnimationFrame(pendingFrameRef.current);
      pendingFrameRef.current = null;
    }
    const finalPointerPoint = { clientX: event.clientX, clientY: event.clientY };
    latestPointerEventRef.current = finalPointerPoint;
    applyDragUpdate(finalDragState, finalPointerPoint);
    boardRef.current?.releasePointerCapture?.(event.pointerId);
    dragStateRef.current = null;
    boardRectRef.current = null;
    latestInteractionEndRef.current?.(finalDragState.slotId);
  }

  return (
    <div className="studio-editor-square" ref={boardRef} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      {baseAssetUrl ? <img className="studio-editor-base" src={baseAssetUrl} alt="" aria-hidden="true" /> : null}
      {slots.map((slot) => {
        const stone = stones[previewSelections?.[slot.code]];
        return (
          <button
            type="button"
            key={slot.id}
            className={`studio-editor-slot${String(selectedSlotId) === String(slot.id) ? " is-active" : ""}${slot.layer_mode === "below" ? " is-below" : " is-above"}`}
            style={previewStoneStyle(slot, stone || null, "preview", { includeRotation: true })}
            onClick={() => onSelectSlot(slot.id)}
            onPointerDown={(event) => beginDrag(event, slot, "move")}
            title={slot.code}
          >
            <span>{slot.code}</span>
            <button
              type="button"
              className="studio-slot-scale-handle"
              aria-label={`Resize ${slot.code}`}
              onPointerDown={(event) => {
                beginDrag(event, slot, "resize", {
                  startClientX: event.clientX,
                  startClientY: event.clientY,
                  startScaleX: Number(slot.scale_x || 1),
                  startScaleY: Number(slot.scale_y || 1)
                });
              }}
            >
              ↘
            </button>
            <button
              type="button"
              className="studio-slot-rotate-handle"
              aria-label={`Rotate ${slot.code}`}
              onPointerDown={(event) => {
                beginDrag(event, slot, "rotate", {
                  centerX: Number(slot.x || 50),
                  centerY: Number(slot.y || 50)
                });
              }}
            >
              ↻
            </button>
          </button>
        );
      })}
    </div>
  );
}
