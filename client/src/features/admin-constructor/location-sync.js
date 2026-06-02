import { useEffect } from "react";
import {
  buildAdminConstructorSearch,
  isSameAdminConstructorState,
  normalizeAdminConstructorState
} from "./studio-state.js";

export function buildAdminConstructorStateSnapshot(state) {
  return {
    section: state.section,
    jewelryStep: state.jewelryStep,
    editorSubview: state.editorSubview,
    stoneStep: state.stoneStep,
    selectedTypeId: state.selectedTypeId,
    selectedVariantId: state.selectedVariantId,
    selectedSlotId: state.selectedSlotId,
    selectedStoneId: state.selectedStoneId
  };
}

export function useAdminConstructorLocationSync({ studio, state, applyState }) {
  useEffect(() => {
    if (!studio) return;
    const normalizedState = normalizeAdminConstructorState(state, studio);
    if (!isSameAdminConstructorState(state, normalizedState)) {
      applyState(normalizedState);
      return;
    }
    const nextSearch = buildAdminConstructorSearch(normalizedState);
    const nextUrl = nextSearch ? `${window.location.pathname}?${nextSearch}` : window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [
    studio,
    state.section,
    state.jewelryStep,
    state.editorSubview,
    state.stoneStep,
    state.selectedTypeId,
    state.selectedVariantId,
    state.selectedSlotId,
    state.selectedStoneId,
    applyState
  ]);
}
