import React, { useEffect, useState } from "react";
import { clampPercent, getConstructorSlotKeys, getLayoutEditorModel } from "./studio-state.js";

export function AdminLayoutBoard({
  typeCode,
  pendantShape,
  layouts,
  onMove,
  defaultBases,
  defaultPositions
}) {
  const boardRef = React.useRef(null);
  const [dragKey, setDragKey] = useState(null);
  const model = getLayoutEditorModel(layouts, typeCode, pendantShape, defaultBases, defaultPositions);
  const slotKeys = typeCode === "pendant" ? ["pendant"] : getConstructorSlotKeys(typeCode);

  useEffect(() => {
    if (!dragKey) return undefined;
    function handleMove(event) {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const nextLeft = clampPercent(((event.clientX - rect.left) / rect.width) * 100);
      const nextTop = clampPercent(((event.clientY - rect.top) / rect.height) * 100);
      onMove(dragKey, { left: nextLeft, top: nextTop });
    }

    function handleUp() {
      setDragKey(null);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragKey, onMove]);

  return (
    <div className="admin-layout-board" ref={boardRef}>
      <img className="admin-layout-base" src={model.baseAsset} alt="" aria-hidden="true" />
      {slotKeys.map((slotKey) => {
        const point = model.positions?.[slotKey] || { left: "50%", top: "50%" };
        return (
          <button
            key={slotKey}
            type="button"
            className="admin-layout-handle"
            style={{ left: point.left, top: point.top }}
            onMouseDown={() => setDragKey(slotKey)}
            title={slotKey}
          >
            <span>{slotKey === "pendant" ? "P" : slotKey.replace("slot-", "")}</span>
          </button>
        );
      })}
    </div>
  );
}
