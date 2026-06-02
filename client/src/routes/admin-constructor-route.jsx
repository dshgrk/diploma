import React, { useEffect, useState } from "react";
import { adminCatalogApi } from "../api";
import { buildMaterialAwareBaseAssetCandidates } from "../jewelry-preview";
import { AdminShell } from "../features/admin/admin-shell.jsx";
import {
  AssetsSection,
  JewelryEditorSection,
  JewelryBasicSection,
  JewelryPreviewSection,
  JewelrySlotsSection,
  JewelryTypeStepSection,
  JewelryVariantStepSection,
  PricingMatrixSection,
  PricingSection,
  StoneEditorSection,
  StoneLibrarySection,
  StudioWorkspaceBar,
  StudioWorkspaceHomeSection,
  StudioWorkspaceMainPanel
} from "../features/admin-constructor/library-sections.jsx";
import {
  buildAdminConstructorStateSnapshot,
  useAdminConstructorLocationSync
} from "../features/admin-constructor/location-sync.js";
import {
  cloneSlotDraft,
  isSlotDraftDirtyAgainstPersisted,
  resolveSlotDraftById,
  slotDraftMatches
} from "../features/admin-constructor/slot-draft.js";
import {
  createStudioMaterialDraft,
  createStudioSizeDraft,
  createStudioSlotDraft,
  createStudioTypeDraft,
  createStudioVariantDraft,
  normalizeAdminConstructorState,
  readAdminConstructorLocationState,
  readFileAsDataUrl,
  slotDisplayYToStoredY,
  slotStoredYToDisplayY
} from "../features/admin-constructor/studio-state.js";
import {
  buildStudioWorkspaceBreadcrumbs,
  STUDIO_JEWELRY_TYPE_OPTIONS,
  STUDIO_WORKSPACE_SECTIONS
} from "../features/admin-constructor/studio-workspace.js";
import {
  buildStudioAssetsState,
  buildStudioHomeState,
  buildStudioJewelryEditorState,
  buildStudioJewelryTypesState,
  buildStudioJewelryVariantsState,
  buildStudioPricingState,
  buildStudioStoneEditorState,
  buildStudioStonesListState
} from "../features/admin-constructor/studio-navigation.js";
import {
  buildJewelryBasicSectionProps,
  buildJewelryPreviewSectionProps,
  buildJewelrySlotsSectionProps
} from "../features/admin-constructor/jewelry-editor-props.js";
import "../styles.css";
import "../styles/admin-constructor.css";

const ADMIN_TYPE_CODE_LABELS = {
  ring: "Каблучка",
  bracelet: "Браслет",
  pendant: "Підвіска",
  earrings: "Сережки"
};

const ADMIN_ASSET_KIND_LABELS = {
  "jewelry-base": "База прикраси",
  stone: "Камінь",
  product: "Товар",
  other: "Інше"
};

const ADMIN_CONSTRUCTOR_CODE_LABELS = {
  none: "Без каменю",
  pearl: "Перлина",
  onyx: "Онікс",
  rose_quartz: "Рожевий кварц",
  garnet: "Гранат",
  opal: "Опал",
  diamond: "Діамант",
  heart_charm: "Шарм серце",
  center: "Центр",
  left: "Ліворуч",
  right: "Праворуч",
  silver: "Срібло",
  gold: "Золото",
  rose_gold: "Рожеве золото",
  heart: "Серце",
  moon: "Місяць",
  drop: "Крапля",
  solitaire: "Один камінь",
  duet: "Два камені",
  trinity: "Три камені",
  orbit: "Орбіта",
  line: "Три камені",
  stud: "Пусети",
  arc: "Дуга"
};

function adminTypeCodeLabel(code) {
  return ADMIN_TYPE_CODE_LABELS[code] || code || "";
}

function adminAssetKindLabel(kind) {
  return ADMIN_ASSET_KIND_LABELS[kind] || kind;
}

function adminConstructorCodeLabel(code) {
  const normalized = String(code || "").trim().toLowerCase();
  if (!normalized) return "";
  if (ADMIN_CONSTRUCTOR_CODE_LABELS[normalized]) return ADMIN_CONSTRUCTOR_CODE_LABELS[normalized];
  const slotMatch = normalized.match(/^slot-(\d+)$/);
  if (slotMatch) return "Слот " + slotMatch[1];
  const stoneMatch = normalized.match(/^stone-(\d+)$/);
  if (stoneMatch) return "Камінь " + stoneMatch[1];
  const sizeMatch = normalized.match(/^size-(\d+)$/);
  if (sizeMatch) return "Розмір " + sizeMatch[1];
  return String(code || "").replace(/[_-]+/g, " ").trim();
}

function adminConstructorTypeName(type, fallback = "Тип прикраси") {
  if (!type) return fallback;
  return type.name_uk || adminTypeCodeLabel(type.code) || adminConstructorCodeLabel(type.code) || fallback;
}

function adminConstructorVariantName(variant, typeCode = "") {
  if (!variant) return "";
  if (variant.name_uk) return variant.name_uk;
  const typeLabel = adminTypeCodeLabel(typeCode || variant.group || "");
  const subtypeLabel = adminConstructorCodeLabel(variant.subtype);
  if (typeLabel && subtypeLabel) return typeLabel + " " + subtypeLabel;
  return typeLabel || adminConstructorCodeLabel(variant.code) || variant.code || "";
}

function adminConstructorSlotName(slot, fallback = "") {
  if (!slot) return fallback;
  return slot.label_uk || adminConstructorCodeLabel(slot.code) || fallback;
}

function adminConstructorStoneName(stone, fallback = "") {
  if (!stone) return fallback;
  return stone.name_uk || adminConstructorCodeLabel(stone.code) || fallback;
}

function adminConstructorAssetName(asset, options = {}) {
  if (!asset) return "";
  const { variants = [], types = [], stones = [] } = options;
  const assetPath = String(asset.path || "")
    .split("/")
    .pop()
    ?.replace(/.[^.]+$/, "") || "";
  const assetLabel = String(asset.label || "").trim().toLowerCase();
  const normalizedBaseName = assetPath.toLowerCase().replace(/-(silver|gold|rose-gold|rose_gold)$/, "");
  const normalizedLabelName = assetLabel.replace(/s+/g, "-").replace(/_/g, "-");
  const variantCandidates = [...new Set([normalizedBaseName.replace(/_/g, "-"), normalizedLabelName])].filter(Boolean);
  const stoneAliasMap = {
    "heart-charm": "heart_charm",
    "product-heart": "heart_charm",
    diamind: "diamond"
  };
  const stoneCandidates = [...new Set([normalizedBaseName, normalizedLabelName])]
    .map((value) => stoneAliasMap[value] || value.replace(/-/g, "_"))
    .filter(Boolean);
  const matchingVariant = variants.find((variant) =>
    variantCandidates.includes(String(variant.code || "").toLowerCase())
  );
  if (matchingVariant) {
    const variantTypeCode = types.find((type) => String(type.id) === String(matchingVariant.type_id))?.code || "";
    return adminConstructorVariantName(matchingVariant, variantTypeCode) || asset.label || assetPath;
  }
  const matchingStone = stones.find((stone) => stoneCandidates.includes(String(stone.code || "").toLowerCase()));
  if (matchingStone) {
    return adminConstructorStoneName(matchingStone, asset.label || assetPath);
  }
  const stoneCodeFallback = stoneCandidates
    .map((candidate) => adminConstructorCodeLabel(candidate))
    .find(Boolean);
  if (stoneCodeFallback) {
    return stoneCodeFallback;
  }
  return asset.label || assetPath;
}

function StudioAdminConstructorPage() {
  const initialAdminConstructorStateRef = React.useRef(null);
  if (!initialAdminConstructorStateRef.current) {
    initialAdminConstructorStateRef.current = readAdminConstructorLocationState();
  }
  const initialAdminConstructorState = initialAdminConstructorStateRef.current;
  const [studio, setStudio] = useState(null);
  const [section, setSection] = useState(initialAdminConstructorState.section);
  const [jewelryStep, setJewelryStep] = useState(initialAdminConstructorState.jewelryStep);
  const [editorSubview, setEditorSubview] = useState(initialAdminConstructorState.editorSubview);
  const [stoneStep, setStoneStep] = useState(initialAdminConstructorState.stoneStep);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState(initialAdminConstructorState.selectedTypeId);
  const [selectedVariantId, setSelectedVariantId] = useState(initialAdminConstructorState.selectedVariantId);
  const [selectedSlotId, setSelectedSlotId] = useState(initialAdminConstructorState.selectedSlotId);
  const [selectedStoneId, setSelectedStoneId] = useState(initialAdminConstructorState.selectedStoneId);
  const [selectedAssetKind, setSelectedAssetKind] = useState("jewelry-base");
  const [previewSelections, setPreviewSelections] = useState({});
  const [typeForm, setTypeForm] = useState(null);
  const [variantForm, setVariantForm] = useState(null);
  const [slotForm, setSlotForm] = useState(null);
  const [stoneForm2, setStoneForm2] = useState(null);
  const [assetUploadState, setAssetUploadState] = useState({ label: "", kind: "jewelry-base", tags: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [slotSaveStatus, setSlotSaveStatus] = useState("idle");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [slotInteractionActive, setSlotInteractionActive] = useState(false);
  const slotFormRef = React.useRef(null);
  const slotDraftDirtyRef = React.useRef(false);
  const slotAutosaveTimerRef = React.useRef(null);
  const slotSaveLoopPromiseRef = React.useRef(null);
  const queuedSlotPersistRef = React.useRef(null);
  const slotSaveInFlightRef = React.useRef(false);
  const lastCanvasInteractionDraftRef = React.useRef(null);
  const previewSelectionsVariantRef = React.useRef("");

  function findCurrentVariantSlotById(slotId) {
    if (!slotId) return null;
    return currentSlotsAdmin.find((item) => String(item.id) === String(slotId)) || null;
  }

  function isSlotDraftDirtyAgainstStudio(draft) {
    return isSlotDraftDirtyAgainstPersisted(draft, findCurrentVariantSlotById(draft?.id));
  }

  const applyAdminConstructorState = React.useCallback((nextState) => {
    setSection(nextState.section);
    setJewelryStep(nextState.jewelryStep);
    setEditorSubview(nextState.editorSubview);
    setStoneStep(nextState.stoneStep);
    setSelectedTypeId(nextState.selectedTypeId);
    setSelectedVariantId(nextState.selectedVariantId);
    setSelectedSlotId(nextState.selectedSlotId);
    setSelectedStoneId(nextState.selectedStoneId);
  }, []);

  function navigateConstructorAdmin(nextStatePatch = {}) {
    const baseState = {
      section,
      jewelryStep,
      editorSubview,
      stoneStep,
      selectedTypeId,
      selectedVariantId,
      selectedSlotId,
      selectedStoneId
    };
    const nextState = normalizeAdminConstructorState({ ...baseState, ...nextStatePatch }, studio);
    applyAdminConstructorState(nextState);
  }

  async function loadStudio(preferred = {}) {
    const data = await adminCatalogApi.getConstructorConfig();
    setStudio(data);
    const baseState = buildAdminConstructorStateSnapshot({
      section,
      jewelryStep,
      editorSubview,
      stoneStep,
      selectedTypeId,
      selectedVariantId,
      selectedSlotId,
      selectedStoneId
    });
    const nextState = normalizeAdminConstructorState({ ...baseState, ...preferred }, data);
    applyAdminConstructorState(nextState);
  }

  useEffect(() => {
    let active = true;
    loadStudio().catch((err) => {
      if (err.status === 401 || err.status === 403) {
        window.location.href = "/admin/login";
        return;
      }
      if (active) setError(err.message);
    });
    return () => {
      active = false;
    };
  }, []);

  useAdminConstructorLocationSync({
    studio,
    state: {
      section,
      jewelryStep,
      editorSubview,
      stoneStep,
      selectedTypeId,
      selectedVariantId,
      selectedSlotId,
      selectedStoneId
    },
    applyState: applyAdminConstructorState
  });

  const types = studio?.types || [];
  const assets = studio?.assets || [];
  const allSlots = studio?.slots || [];
  const allStones = studio?.stones || [];
  const allMatrix = studio?.variant_stones || [];
  const currentTypeAdmin = types.find((item) => String(item.id) === String(selectedTypeId)) || null;
  const variants = (studio?.variants || []).filter((item) => String(item.type_id) === String(selectedTypeId));
  const currentVariantAdmin = variants.find((item) => String(item.id) === String(selectedVariantId)) || null;
  const currentSlotsAdmin = currentVariantAdmin ? allSlots.filter((item) => String(item.variant_id) === String(currentVariantAdmin.id) && item.is_active !== false) : [];
  const currentSlotAdmin = currentSlotsAdmin.find((item) => String(item.id) === String(selectedSlotId)) || currentSlotsAdmin[0] || null;
  const editableSlotsAdmin = currentSlotsAdmin.map((slot) => (
    slotForm?.id && String(slot.id) === String(slotForm.id) ? { ...slot, ...slotForm } : slot
  ));
  const slotDraftDirty = isSlotDraftDirtyAgainstStudio(slotForm);
  const currentVariantMatrix = currentVariantAdmin ? allMatrix.filter((item) => String(item.variant_id) === String(currentVariantAdmin.id)) : [];
  const assetsById = Object.fromEntries(assets.map((asset) => [asset.id, asset]));
  const stonesDecorated = allStones.map((stone) => ({
    ...stone,
    asset_url: stone.asset_id ? assetsById[stone.asset_id]?.path || null : null
  }));
  const currentStoneAdmin = stonesDecorated.find((item) => String(item.id) === String(selectedStoneId)) || null;
  const stonesByCodeAdmin = Object.fromEntries(stonesDecorated.map((stone) => [stone.code, stone]));
  const availableVariantStones = stonesDecorated.filter((stone) => currentVariantMatrix.some((item) => String(item.stone_id) === String(stone.id) && item.is_enabled !== false));
  const availableVariantPreviewStones = availableVariantStones.filter((stone) => stone.code !== "none");
  const selectedPreviewStoneCode = (slotForm?.code ? previewSelections[slotForm.code] : currentSlotAdmin?.code ? previewSelections[currentSlotAdmin.code] : null) || "none";

  useEffect(() => {
    if (currentTypeAdmin && selectedTypeId && selectedTypeId !== "new") {
      setTypeForm(JSON.parse(JSON.stringify(currentTypeAdmin)));
    }
  }, [selectedTypeId, studio]);

  useEffect(() => {
    if (currentVariantAdmin && selectedVariantId && selectedVariantId !== "new") {
      setVariantForm(JSON.parse(JSON.stringify(currentVariantAdmin)));
    }
  }, [selectedTypeId, selectedVariantId, studio]);

  useEffect(() => {
    if (!currentVariantAdmin) return;
    const currentDraft = slotFormRef.current;
    const selectedSlot = currentSlotsAdmin.find((item) => String(item.id) === String(selectedSlotId)) || currentSlotAdmin;
    const isSameSlotDraft = Boolean(currentDraft?.id && selectedSlot?.id && String(currentDraft.id) === String(selectedSlot.id));
    if (selectedSlot) {
      if ((slotDraftDirtyRef.current || slotSaveInFlightRef.current) && isSameSlotDraft) return;
      if (String(selectedSlotId || "") !== String(selectedSlot.id)) {
        setSelectedSlotId(String(selectedSlot.id));
      }
      if (!isSameSlotDraft || !currentDraft || !slotDraftDirtyRef.current) {
        const nextDraft = cloneSlotDraft(selectedSlot);
        slotFormRef.current = nextDraft;
        setSlotForm(nextDraft);
      }
      return;
    }
    if (!slotDraftDirtyRef.current && !slotSaveInFlightRef.current) {
      const nextDraft = createStudioSlotDraft(currentVariantAdmin.id, currentSlotsAdmin.length + 1);
      slotFormRef.current = nextDraft;
      setSlotForm(nextDraft);
    }
  }, [selectedVariantId, selectedSlotId, studio]);

  useEffect(() => {
    if (currentStoneAdmin && selectedStoneId && selectedStoneId !== "new") {
      setStoneForm2(JSON.parse(JSON.stringify(currentStoneAdmin)));
    }
  }, [selectedStoneId, studio]);

  useEffect(() => {
    if (!currentVariantAdmin) return;
    const defaults = {};
    const defaultEntry = currentVariantMatrix.find((item) => item.is_default);
    currentSlotsAdmin.forEach((slot) => {
      if (!defaultEntry) return;
      const stone = stonesDecorated.find((item) => String(item.id) === String(defaultEntry.stone_id));
      if (stone) defaults[slot.code] = stone.code;
    });
    const variantKey = String(currentVariantAdmin.id);
    const isVariantChanged = previewSelectionsVariantRef.current !== variantKey;
    previewSelectionsVariantRef.current = variantKey;
    const slotCodes = new Set(currentSlotsAdmin.map((slot) => slot.code));
    const allowedStoneCodes = new Set(["none", ...availableVariantStones.map((stone) => stone.code)]);
    setPreviewSelections((current) => {
      if (isVariantChanged) return defaults;
      const next = {};
      currentSlotsAdmin.forEach((slot) => {
        const currentStoneCode = current[slot.code];
        if (currentStoneCode && allowedStoneCodes.has(currentStoneCode)) {
          next[slot.code] = currentStoneCode;
          return;
        }
        if (defaults[slot.code]) {
          next[slot.code] = defaults[slot.code];
        }
      });
      Object.entries(current).forEach(([slotCode, stoneCode]) => {
        if (slotCodes.has(slotCode) || !allowedStoneCodes.has(stoneCode)) return;
        next[slotCode] = stoneCode;
      });
      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [selectedVariantId, studio]);

  useEffect(() => {
    setPendingDelete(null);
  }, [selectedTypeId, selectedVariantId, selectedStoneId, jewelryStep, stoneStep, section]);

  function variantBaseAssetUrl(variant) {
    return variant?.base_asset_id ? assetsById[variant.base_asset_id]?.path || null : null;
  }

  function variantAdminPreviewCandidates(variant, preferredMaterials = ["gold", "silver", "rose_gold"]) {
    if (!variant) return [];
    const previewVariant = { ...variant, base_asset_url: variantBaseAssetUrl(variant) };
    return [
      ...new Set(
        preferredMaterials.flatMap((materialCode) => buildMaterialAwareBaseAssetCandidates(previewVariant, materialCode))
      )
    ];
  }

  function variantAdminPreviewAssetUrl(variant, preferredMaterials = ["gold", "silver", "rose_gold"]) {
    return variantAdminPreviewCandidates(variant, preferredMaterials)[0] || variantBaseAssetUrl(variant);
  }

  const currentVariantPreview = currentVariantAdmin ? { ...currentVariantAdmin, base_asset_url: variantBaseAssetUrl(currentVariantAdmin) } : null;
  const currentVariantEditorBaseAsset = currentVariantAdmin ? variantAdminPreviewAssetUrl(currentVariantAdmin, ["silver", "gold", "rose_gold"]) : null;

  useEffect(() => {
    slotFormRef.current = slotForm;
  }, [slotForm]);

  useEffect(() => {
    slotDraftDirtyRef.current = slotDraftDirty;
  }, [slotDraftDirty]);

  async function saveType() {
    if (!typeForm) return;
    setIsSaving(true);
    setError("");
    try {
      const saved = typeForm.id
        ? await adminCatalogApi.updateType(typeForm.id, typeForm)
        : await adminCatalogApi.createType(typeForm);
      await loadStudio(buildStudioJewelryVariantsState(saved.id));
      setNotice("��� ���������");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveVariant() {
    if (!variantForm) return;
    setIsSaving(true);
    setError("");
    try {
      const payload = { ...variantForm, type_id: Number(selectedTypeId) };
      const saved = variantForm.id
        ? await adminCatalogApi.updateVariant(variantForm.id, payload)
        : await adminCatalogApi.createVariant(payload);
      await loadStudio(buildStudioJewelryEditorState({
        selectedTypeId,
        selectedVariantId: saved.id
      }));
      setNotice("������ ���������");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  function clearSlotAutosaveTimer() {
    if (!slotAutosaveTimerRef.current) return;
    window.clearTimeout(slotAutosaveTimerRef.current);
    slotAutosaveTimerRef.current = null;
  }

  function patchStudioSlot(savedSlot, snapshot) {
    const savedDraft = cloneSlotDraft(savedSlot);
    setStudio((currentStudio) => {
      if (!currentStudio) return currentStudio;
      const slots = currentStudio.slots || [];
      const existingIndex = slots.findIndex((slot) => String(slot.id) === String(savedDraft.id));
      const nextSlots = existingIndex === -1
        ? [...slots, savedDraft]
        : slots.map((slot) => (String(slot.id) === String(savedDraft.id) ? { ...slot, ...savedDraft } : slot));
      return { ...currentStudio, slots: nextSlots };
    });

    const latestDraft = slotFormRef.current;
    const snapshotId = String(snapshot?.id || "");
    const latestId = String(latestDraft?.id || "");
    const latestStillMatchesSavedRequest = latestDraft && (latestId === snapshotId || !snapshotId) && slotDraftMatches(latestDraft, snapshot);
    if (latestStillMatchesSavedRequest) {
      setSelectedSlotId(String(savedDraft.id));
      slotFormRef.current = savedDraft;
      setSlotForm(savedDraft);
      slotDraftDirtyRef.current = false;
    } else if (!snapshot?.id && savedDraft.id && latestDraft && !latestDraft.id && slotDraftMatches(latestDraft, snapshot)) {
      const nextDraft = { ...latestDraft, id: savedDraft.id };
      setSelectedSlotId(String(savedDraft.id));
      slotFormRef.current = nextDraft;
      setSlotForm(nextDraft);
    }
  }

  async function performSlotPersist(snapshot, options = {}) {
    if (!snapshot || !currentVariantAdmin) return true;
    const persistedSlot = snapshot.id ? findCurrentVariantSlotById(snapshot.id) : null;
    if (!options.force && !isSlotDraftDirtyAgainstStudio(snapshot) && persistedSlot) {
      setSlotSaveStatus("saved");
      return true;
    }
    slotSaveInFlightRef.current = true;
    setSlotSaveStatus("saving");
    setIsSaving(true);
    setError("");
    try {
      const payload = { ...snapshot, variant_id: Number(currentVariantAdmin.id) };
      const saved = snapshot.id
        ? await adminCatalogApi.updateSlot(snapshot.id, payload)
        : await adminCatalogApi.createSlot(payload);
      if (options.reload) {
        await loadStudio(buildStudioJewelryEditorState({
          selectedTypeId,
          selectedVariantId,
          editorSubview,
          selectedSlotId: saved.id
        }));
      } else {
        patchStudioSlot(saved, snapshot);
      }
      if (!options.silent) {
        setNotice("���� ���������");
      }
      setSlotSaveStatus("saved");
      lastCanvasInteractionDraftRef.current = null;
      return true;
    } catch (err) {
      setError(err.message);
      setSlotSaveStatus("error");
      return false;
    } finally {
      slotSaveInFlightRef.current = false;
      setIsSaving(false);
    }
  }

  async function flushQueuedSlotPersists() {
    if (slotSaveLoopPromiseRef.current) {
      return slotSaveLoopPromiseRef.current;
    }
    if (!queuedSlotPersistRef.current) {
      return true;
    }
    slotSaveLoopPromiseRef.current = (async () => {
      let lastResult = true;
      while (queuedSlotPersistRef.current) {
        const nextRequest = queuedSlotPersistRef.current;
        queuedSlotPersistRef.current = null;
        lastResult = await performSlotPersist(nextRequest.snapshot, nextRequest.options);
        if (!lastResult) {
          queuedSlotPersistRef.current = null;
          break;
        }
      }
      slotSaveLoopPromiseRef.current = null;
      return lastResult;
    })();
    return slotSaveLoopPromiseRef.current;
  }

  async function persistSlotDraft(draftInput, options = {}) {
    const snapshot = cloneSlotDraft(draftInput ?? slotFormRef.current);
    if (!snapshot || !currentVariantAdmin) return true;
    queuedSlotPersistRef.current = {
      snapshot,
      options: {
        force: Boolean(options.force),
        silent: options.silent !== false,
        reload: Boolean(options.reload)
      }
    };
    return flushQueuedSlotPersists();
  }

  function queueSlotAutosave(draftInput, options = {}) {
    const snapshot = cloneSlotDraft(draftInput ?? slotFormRef.current);
    if (!snapshot) return;
    clearSlotAutosaveTimer();
    setSlotSaveStatus(options.status || "waiting");
    slotAutosaveTimerRef.current = window.setTimeout(() => {
      slotAutosaveTimerRef.current = null;
      void persistSlotDraft(snapshot, { silent: true, force: options.force });
    }, options.delay ?? 500);
  }

  async function flushSlotDraftBeforeNavigation() {
    clearSlotAutosaveTimer();
    if (slotSaveLoopPromiseRef.current) {
      const savedInFlight = await slotSaveLoopPromiseRef.current;
      if (!savedInFlight) return false;
    }
    if (!slotDraftDirtyRef.current) {
      return true;
    }
    return persistSlotDraft(slotFormRef.current, { silent: true });
  }

  async function navigateAfterSlotPersist(nextStatePatch = {}) {
    const saved = await flushSlotDraftBeforeNavigation();
    if (!saved) return false;
    navigateConstructorAdmin(nextStatePatch);
    return true;
  }

  async function saveCurrentSlotDraft(options = {}) {
    clearSlotAutosaveTimer();
    return persistSlotDraft(slotFormRef.current, { silent: options.silent !== false, force: options.force });
  }

  async function saveSlot() {
    await saveCurrentSlotDraft({ silent: false, force: true });
  }

  function slotSaveStatusLabel() {
    if (slotInteractionActive || slotSaveStatus === "dirty") return "��������";
    if (slotSaveStatus === "waiting") return "���������� ����� 0.5�";
    if (slotSaveStatus === "saving") return "����������...";
    if (slotSaveStatus === "saved") return "���������";
    if (slotSaveStatus === "error") return "������� ����������";
    return "������";
  }

  async function commitSlotIfDirty(slotId) {
    clearSlotAutosaveTimer();
    const draft = slotFormRef.current;
    if (!draft) return true;
    if (slotId && draft.id && String(draft.id) !== String(slotId)) return true;
    if (!isSlotDraftDirtyAgainstStudio(draft)) return true;
    return persistSlotDraft(draft, { silent: true });
  }

  async function selectSlotDraft(slotId) {
    const nextSlot = currentSlotsAdmin.find((item) => String(item.id) === String(slotId)) || null;
    if (!nextSlot) return;
    if (String(selectedSlotId || "") !== String(slotId)) {
      const saved = await flushSlotDraftBeforeNavigation();
      if (!saved) return;
    }
    setSelectedSlotId(String(slotId));
    const nextDraft = cloneSlotDraft(nextSlot);
    slotFormRef.current = nextDraft;
    setSlotForm(nextDraft);
  }

  function selectSlotDraftLocally(slotId) {
    const nextSlot = currentSlotsAdmin.find((item) => String(item.id) === String(slotId)) || null;
    if (!nextSlot) return;
    setSelectedSlotId(String(slotId));
    if (String(slotFormRef.current?.id || "") === String(slotId)) return;
    const nextDraft = cloneSlotDraft(nextSlot);
    slotFormRef.current = nextDraft;
    setSlotForm(nextDraft);
    setSlotSaveStatus("idle");
  }

  function applySlotDraftSnapshot(nextDraft, options = {}) {
    const snapshot = cloneSlotDraft(nextDraft);
    slotFormRef.current = snapshot;
    setSlotForm(snapshot);
    slotDraftDirtyRef.current = true;
    setSlotSaveStatus(options.status || "dirty");
    if (options.autosave !== false && !slotInteractionActive) {
      queueSlotAutosave(snapshot, { delay: options.delay ?? 500, force: options.force });
    }
    return snapshot;
  }

  function updateSlotFormDraft(updater, options = {}) {
    const baseDraft = cloneSlotDraft(slotFormRef.current || slotForm || {});
    const nextDraft = typeof updater === "function"
      ? updater(baseDraft)
      : { ...baseDraft, ...updater };
    return applySlotDraftSnapshot(nextDraft, options);
  }

  useEffect(() => () => {
    clearSlotAutosaveTimer();
  }, []);

  async function deleteSlotAdmin() {
    if (!currentSlotAdmin?.id) return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.deactivateSlot(currentSlotAdmin.id);
      await loadStudio(buildStudioJewelryEditorState({
        selectedTypeId,
        selectedVariantId
      }));
      setNotice("���� ��������");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function duplicateCurrentSlot() {
    if (!currentSlotAdmin || !currentVariantAdmin) return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.createSlot({
        ...currentSlotAdmin,
        id: undefined,
        variant_id: Number(currentVariantAdmin.id),
        code: currentSlotAdmin.code + "-copy",
        label_uk: (currentSlotAdmin.label_uk || currentSlotAdmin.code) + " ����",
        label_en: (currentSlotAdmin.label_en || currentSlotAdmin.code) + " copy",
        sort_order: currentSlotsAdmin.length + 1,
        x: Math.min(95, Number(currentSlotAdmin.x || 50) + 4),
        y: Math.min(95, Number(currentSlotAdmin.y || 50) + 4)
      });
      await loadStudio();
      setNotice("���� ����������");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveStone() {
    if (!stoneForm2) return;
    setIsSaving(true);
    setError("");
    try {
      const saved = stoneForm2.id
        ? await adminCatalogApi.updateStone(stoneForm2.id, stoneForm2)
        : await adminCatalogApi.createStone(stoneForm2);
      await loadStudio(buildStudioStoneEditorState(saved.id, { selectedTypeId, selectedVariantId }));
      setNotice("����� ���������");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteStoneAdmin() {
    if (!stoneForm2?.id) return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.deactivateStone(stoneForm2.id);
      await loadStudio(buildStudioStonesListState({ selectedTypeId, selectedVariantId }));
      setNotice("����� ��������");
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssetUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await adminCatalogApi.uploadAsset({
        file_name: file.name,
        kind: assetUploadState.kind,
        label: assetUploadState.label || file.name.replace(/.[^.]+$/, ""),
        tags: assetUploadState.tags.split(",").map((item) => item.trim()).filter(Boolean),
        data_url: dataUrl
      });
      await loadStudio();
      setNotice("���� �����������");
      event.target.value = "";
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAssetAdmin(asset) {
    if (!asset?.id) return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.deleteAsset(asset.id);
      await loadStudio(buildStudioAssetsState({ selectedTypeId, selectedVariantId, selectedStoneId }));
      setPendingDelete(null);
      setNotice("���� ��������");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function setVariantStone(entry, patch) {
    if (!currentVariantAdmin) return;
    try {
      await adminCatalogApi.upsertVariantStone({ ...entry, ...patch, variant_id: currentVariantAdmin.id, stone_id: entry.stone_id });
      await loadStudio();
    } catch (err) {
      setError(err.message);
    }
  }

  async function startNewSlot() {
    if (!currentVariantAdmin) return;
    const saved = await flushSlotDraftBeforeNavigation();
    if (!saved) return;
    setSelectedSlotId("");
    const nextDraft = createStudioSlotDraft(currentVariantAdmin.id, currentSlotsAdmin.length + 1);
    slotFormRef.current = nextDraft;
    setSlotForm(nextDraft);
  }

  async function startNewType() {
    const saved = await flushSlotDraftBeforeNavigation();
    if (!saved) return;
    navigateConstructorAdmin({
      ...buildStudioJewelryEditorState({
        selectedTypeId: "new",
        selectedVariantId: "",
        editorSubview: "basic"
      })
    });
    setTypeForm(createStudioTypeDraft(types.length + 1));
    setVariantForm(null);
  }

  async function startNewVariant() {
    if (!selectedTypeId) return;
    const saved = await flushSlotDraftBeforeNavigation();
    if (!saved) return;
    navigateConstructorAdmin({
      ...buildStudioJewelryEditorState({
        selectedTypeId,
        selectedVariantId: "new",
        editorSubview: "basic"
      })
    });
    setVariantForm(createStudioVariantDraft(selectedTypeId, variants.length + 1));
  }

  async function startNewStone() {
    const saved = await flushSlotDraftBeforeNavigation();
    if (!saved) return;
    navigateConstructorAdmin({
      ...buildStudioStoneEditorState("new")
    });
    setStoneForm2({
      code: "",
      name_uk: "",
      name_en: "",
      asset_id: null,
      default_scale_x: 1,
      default_scale_y: 1,
      default_layer_mode: "above",
      is_active: true,
      sort_order: allStones.length + 1
    });
  }

  async function deleteVariantAdmin() {
    if (!currentVariantAdmin?.id) return;
    setIsSaving(true);
    setError("");
    try {
      const nextTypeId = selectedTypeId;
      await adminCatalogApi.deactivateVariant(currentVariantAdmin.id);
      await loadStudio(buildStudioJewelryVariantsState(nextTypeId));
      setNotice("������ ��������");
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteTypeAdmin() {
    if (!currentTypeAdmin?.id) return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.deactivateType(currentTypeAdmin.id);
      await loadStudio(buildStudioJewelryTypesState({ selectedTypeId: "" }));
      setNotice("��� ��������");
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  function requestDelete(kind, id) {
    setPendingDelete({ kind, id: String(id) });
  }

  function cancelDelete() {
    setPendingDelete(null);
  }

  function isDeletePending(kind, id) {
    return pendingDelete?.kind === kind && String(pendingDelete?.id) === String(id);
  }

  async function updateSelectedSlotPreview(stoneCode) {
    const targetCode = slotForm?.code || currentSlotAdmin?.code;
    if (!targetCode) return;
    const saved = await flushSlotDraftBeforeNavigation();
    if (!saved) return;
    setPreviewSelections((current) => ({ ...current, [targetCode]: stoneCode }));
  }

  async function openSection(nextSection) {
    if (nextSection === "jewelry") {
      await navigateAfterSlotPersist(buildStudioJewelryTypesState());
      return;
    }
    if (nextSection === "stones") {
      await navigateAfterSlotPersist(buildStudioStonesListState());
      return;
    }
    if (nextSection === "pricing") {
      await navigateAfterSlotPersist(buildStudioPricingState("", "", { selectedStoneId: "" }));
      return;
    }
    if (nextSection === "assets") {
      await navigateAfterSlotPersist(buildStudioAssetsState());
      return;
    }
    await navigateAfterSlotPersist(buildStudioHomeState());
  }

  async function openJewelryVariantsStep(nextTypeId = selectedTypeId, extra = {}) {
    await navigateAfterSlotPersist(buildStudioJewelryVariantsState(nextTypeId, extra));
  }

  async function openJewelryBasicStep(nextTypeId = selectedTypeId, extra = {}) {
    await navigateAfterSlotPersist(buildStudioJewelryEditorState({
      selectedTypeId: nextTypeId,
      selectedVariantId: extra.selectedVariantId ?? "",
      editorSubview: "basic",
      selectedSlotId: extra.selectedSlotId ?? "",
      selectedStoneId: extra.selectedStoneId ?? ""
    }));
  }

  async function openJewelryEditorSubview(nextSubview, extra = {}) {
    await navigateAfterSlotPersist(buildStudioJewelryEditorState({
      selectedTypeId: extra.selectedTypeId ?? selectedTypeId,
      selectedVariantId: extra.selectedVariantId ?? selectedVariantId,
      editorSubview: nextSubview,
      selectedSlotId: extra.selectedSlotId ?? selectedSlotId,
      selectedStoneId: extra.selectedStoneId ?? ""
    }));
  }

  async function openPricingForVariant(nextVariantId = selectedVariantId, nextTypeId = selectedTypeId, extra = {}) {
    await navigateAfterSlotPersist(buildStudioPricingState(nextTypeId, nextVariantId, extra));
  }

  async function openType(typeId) {
    await openJewelryVariantsStep(String(typeId));
  }

  async function openVariant(variantId, subview = "slots") {
    const variant = (studio?.variants || []).find((item) => String(item.id) === String(variantId)) || null;
    await openJewelryEditorSubview(subview, {
      selectedTypeId: variant ? String(variant.type_id) : selectedTypeId,
      selectedVariantId: String(variantId),
      selectedSlotId: "",
      selectedStoneId: ""
    });
  }

  async function openStoneEditor(stoneId) {
    await navigateAfterSlotPersist(buildStudioStoneEditorState(String(stoneId)));
  }

  const workspaceSections = STUDIO_WORKSPACE_SECTIONS;
  const jewelryTypes = STUDIO_JEWELRY_TYPE_OPTIONS;
  const selectedTypeCard = jewelryTypes.find(([code]) => code === currentTypeAdmin?.code);
  const currentStoneUsage = stoneForm2?.id ? allMatrix.filter((item) => String(item.stone_id) === String(stoneForm2.id) && item.is_enabled !== false) : [];

  function updateTypeField(key, value) {
    setTypeForm((current) => ({ ...(current || {}), [key]: value }));
  }

  function updateTypeMaterial(index, key, value) {
    setTypeForm((current) => ({
      ...(current || {}),
      materials: (current?.materials || []).map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      ))
    }));
  }

  function addTypeMaterial() {
    setTypeForm((current) => ({
      ...(current || {}),
      materials: [...(current?.materials || []), createStudioMaterialDraft((current?.materials || []).length + 1)]
    }));
  }

  function removeTypeMaterial(index) {
    setTypeForm((current) => ({
      ...(current || {}),
      materials: (current?.materials || []).filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function updateTypeSize(index, key, value) {
    setTypeForm((current) => {
      const nextSizes = (current?.size_options || []).map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      ));
      return {
        ...(current || {}),
        size_options: key === "is_default" && value
          ? nextSizes.map((item, itemIndex) => ({ ...item, is_default: itemIndex === index }))
          : nextSizes
      };
    });
  }

  function addTypeSize() {
    setTypeForm((current) => ({
      ...(current || {}),
      size_options: [...(current?.size_options || []), createStudioSizeDraft((current?.size_options || []).length + 1)]
    }));
  }

  function removeTypeSize(index) {
    setTypeForm((current) => ({
      ...(current || {}),
      size_options: (current?.size_options || []).filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function updateEngravingField(key, value) {
    setTypeForm((current) => ({
      ...(current || {}),
      engraving: {
        ...(current?.engraving || {}),
        [key]: value
      }
    }));
  }

  const breadcrumbs = buildStudioWorkspaceBreadcrumbs({
    section,
    jewelryStep,
    stoneStep,
    selectedTypeId,
    currentTypeAdmin,
    currentVariantAdmin,
    currentSlotAdmin,
    stoneForm: stoneForm2,
    selectedTypeLabel: selectedTypeCard?.[1],
    getTypeName: adminConstructorTypeName,
    getVariantName: adminConstructorVariantName,
    getStoneName: adminConstructorStoneName,
    navigateAfterSlotPersist
  });

  function resolveCanvasBaseDraft(slotId) {
    return resolveSlotDraftById(slotId, slotFormRef.current, currentSlotsAdmin);
  }

  function applyCanvasDraftPatch(slotId, patch) {
    const baseDraft = resolveCanvasBaseDraft(slotId);
    if (!baseDraft) return;
    setSelectedSlotId(String(slotId));
    lastCanvasInteractionDraftRef.current = updateSlotFormDraft({ ...baseDraft, ...patch }, { autosave: false });
  }

  const jewelrySlotsSectionProps = buildJewelrySlotsSectionProps({
    currentVariantAdmin,
    currentTypeAdmin,
    currentVariantPreview,
    currentVariantEditorBaseAsset,
    currentSlots: currentSlotsAdmin,
    currentSlot: currentSlotAdmin,
    slotForm,
    slotDraftDirty,
    slotSaveStatus,
    slotSaveStatusLabel,
    selectedPreviewStoneCode,
    availablePreviewStones: availableVariantPreviewStones,
    editableSlots: editableSlotsAdmin,
    stonesByCode: stonesByCodeAdmin,
    previewSelections,
    isSaving,
    displayedY: slotStoredYToDisplayY(slotForm?.y || 0),
    onOpenStones: () => void openSection("stones"),
    onBackToVariants: () => void openJewelryVariantsStep(),
    onStartNewSlot: () => void startNewSlot(),
    onDuplicateSlot: duplicateCurrentSlot,
    onDeleteSlot: deleteSlotAdmin,
    onSaveSlot: saveSlot,
    onSelectSlot: (slotId) => {
      if (slotId) {
        void selectSlotDraft(slotId);
        return;
      }
      void openJewelryVariantsStep();
    },
    onPreviewStonePick: (stoneCode) => void updateSelectedSlotPreview(stoneCode),
    onCanvasInteractionStart: () => {
      clearSlotAutosaveTimer();
      setSlotInteractionActive(true);
      setSlotSaveStatus("dirty");
    },
    onCanvasMoveSlot: (slotId, point) => applyCanvasDraftPatch(slotId, { x: point.x, y: point.y }),
    onCanvasResizeSlot: (slotId, scalePatch) => applyCanvasDraftPatch(slotId, scalePatch),
    onCanvasRotateSlot: (slotId, rotationPatch) => applyCanvasDraftPatch(slotId, rotationPatch),
    onCanvasInteractionEnd: (slotId) => {
      const finalSnapshot = cloneSlotDraft(lastCanvasInteractionDraftRef.current || slotFormRef.current);
      lastCanvasInteractionDraftRef.current = null;
      setSlotInteractionActive(false);
      if (!finalSnapshot) return;
      if (slotId && finalSnapshot.id && String(finalSnapshot.id) !== String(slotId)) return;
      queueSlotAutosave(finalSnapshot, { delay: 500, force: true });
    },
    onSlotFieldChange: (key, value) => updateSlotFormDraft((current) => {
      if (key === "display_y") {
        return { ...current, y: slotDisplayYToStoredY(Number(value)) };
      }
      return { ...current, [key]: value };
    }),
    getVariantName: adminConstructorVariantName,
    getSlotName: adminConstructorSlotName,
    getStoneName: adminConstructorStoneName
  });

  const jewelryBasicSectionProps = typeForm ? buildJewelryBasicSectionProps({
    typeForm,
    variantForm,
    assets,
    currentTypeAdmin,
    currentVariantAdmin,
    selectedTypeId,
    isSaving,
    isDeletePending,
    onBackToVariants: () => void openJewelryVariantsStep(),
    onCreateVariant: startNewVariant,
    onDeleteVariant: () => requestDelete("variant", currentVariantAdmin?.id),
    onConfirmDeleteVariant: deleteVariantAdmin,
    onDeleteType: () => requestDelete("type", currentTypeAdmin?.id),
    onConfirmDeleteType: deleteTypeAdmin,
    onCancelDelete: cancelDelete,
    onSaveVariant: saveVariant,
    onSaveType: saveType,
    onSetVariantForm: setVariantForm,
    onUpdateTypeField: updateTypeField,
    onUpdateTypeMaterial: updateTypeMaterial,
    onAddTypeMaterial: addTypeMaterial,
    onRemoveTypeMaterial: removeTypeMaterial,
    onUpdateTypeSize: updateTypeSize,
    onAddTypeSize: addTypeSize,
    onRemoveTypeSize: removeTypeSize,
    onUpdateEngravingField: updateEngravingField
  }) : null;

  const jewelryPreviewSectionProps = currentVariantPreview ? buildJewelryPreviewSectionProps({
    currentVariantPreview,
    currentVariantAdmin,
    currentSlots: currentSlotsAdmin,
    stonesByCode: stonesByCodeAdmin,
    previewSelections,
    availablePreviewStones: availableVariantPreviewStones,
    onPreviewSelectionChange: (slotCode, stoneCode) => setPreviewSelections((current) => ({ ...current, [slotCode]: stoneCode })),
    getSlotName: adminConstructorSlotName,
    getStoneName: adminConstructorStoneName,
    getVariantAssetCandidates: variantAdminPreviewCandidates
  }) : null;

  const homeSectionPanel = <StudioWorkspaceHomeSection sections={workspaceSections} onOpenSection={openSection} />;
  const jewelryTypeStepPanel = (
    <JewelryTypeStepSection
      types={types}
      variants={studio?.variants || []}
      jewelryTypes={jewelryTypes}
      onCreate={() => void startNewType()}
      onOpenType={openType}
      getTypeName={adminConstructorTypeName}
    />
  );
  const jewelryVariantStepPanel = (
    <JewelryVariantStepSection
      currentTypeAdmin={currentTypeAdmin}
      currentTypeLabel={selectedTypeCard?.[1]}
      selectedTypeId={selectedTypeId}
      variants={variants}
      allSlots={allSlots}
      isSaving={isSaving}
      isDeletePending={isDeletePending}
      onBack={() => void navigateAfterSlotPersist({
        section: "jewelry",
        jewelryStep: "types",
        editorSubview: "slots",
        selectedVariantId: "",
        selectedSlotId: "",
        selectedStoneId: ""
      })}
      onOpenTypeBasic={() => {
        void openJewelryBasicStep();
      }}
      onCreateVariant={() => void startNewVariant()}
      onDeleteType={() => requestDelete("type", currentTypeAdmin?.id)}
      onConfirmDeleteType={deleteTypeAdmin}
      onCancelDelete={cancelDelete}
      onOpenVariant={openVariant}
      getVariantName={adminConstructorVariantName}
      getVariantAssetUrl={variantAdminPreviewAssetUrl}
      getVariantAssetCandidates={variantAdminPreviewCandidates}
      getVariantBaseAssetUrl={variantBaseAssetUrl}
    />
  );
  const pricingMatrixPanel = (
    <PricingMatrixSection
      currentVariant={currentVariantAdmin}
      stones={stonesDecorated}
      matrix={currentVariantMatrix}
      onUpdate={setVariantStone}
      onOpenStones={() => void openSection("stones")}
      onOpenPricing={() => void openPricingForVariant()}
      getStoneName={adminConstructorStoneName}
    />
  );
  const jewelryEditorPanel = !typeForm ? null : (
    <JewelryEditorSection
      editorSubview={editorSubview}
      onOpenSubview={(key) => {
        void openJewelryEditorSubview(key, {
          selectedSlotId: slotFormRef.current?.id || selectedSlotId,
        });
      }}
      slots={<JewelrySlotsSection {...jewelrySlotsSectionProps} />}
      basic={jewelryBasicSectionProps ? <JewelryBasicSection {...jewelryBasicSectionProps} /> : null}
      matrix={pricingMatrixPanel}
      preview={jewelryPreviewSectionProps ? <JewelryPreviewSection {...jewelryPreviewSectionProps} /> : null}
    />
  );
  const stonesListPanel = (
    <StoneLibrarySection
      stones={stonesDecorated}
      matrix={allMatrix}
      getStoneName={adminConstructorStoneName}
      onCreate={() => void startNewStone()}
      onOpenEditor={openStoneEditor}
    />
  );
  const stoneEditorPanel = (
    <StoneEditorSection
      form={stoneForm2}
      assets={assets}
      assetsById={assetsById}
      stones={stonesDecorated}
      usage={currentStoneUsage}
      studioVariants={studio?.variants || []}
      types={types}
      isSaving={isSaving}
      isDeletePending={isDeletePending}
      navigateBack={() => void navigateAfterSlotPersist({
        section: "stones",
        stoneStep: "list",
        selectedStoneId: ""
      })}
      onDelete={() => requestDelete("stone", stoneForm2?.id)}
      onConfirmDelete={deleteStoneAdmin}
      onCancelDelete={cancelDelete}
      onSave={saveStone}
      onChange={(patch) => setStoneForm2((current) => ({ ...current, ...patch }))}
      onOpenUsage={(entry, variant) => {
        void openPricingForVariant(String(entry.variant_id), String(variant?.type_id || selectedTypeId));
      }}
      getStoneName={adminConstructorStoneName}
      getVariantName={adminConstructorVariantName}
      getAssetName={adminConstructorAssetName}
    />
  );
  const assetsPanel = (
    <AssetsSection
      assets={assets}
      selectedAssetKind={selectedAssetKind}
      assetUploadState={assetUploadState}
      studioVariants={studio?.variants || []}
      types={types}
      stones={stonesDecorated}
      isSaving={isSaving}
      isDeletePending={isDeletePending}
      onAssetStateChange={(patch) => setAssetUploadState((current) => ({ ...current, ...patch }))}
      onUpload={handleAssetUpload}
      onSelectKind={setSelectedAssetKind}
      onDelete={(asset) => requestDelete("asset", asset.id)}
      onConfirmDelete={deleteAssetAdmin}
      onCancelDelete={cancelDelete}
      getAssetKindLabel={adminAssetKindLabel}
      getAssetName={adminConstructorAssetName}
    />
  );
  const pricingPanel = (
    <PricingSection
      types={types}
      variants={variants}
      selectedTypeId={selectedTypeId}
      selectedVariantId={selectedVariantId}
      currentTypeCode={currentTypeAdmin?.code}
      currentVariant={currentVariantAdmin}
      stones={stonesDecorated}
      matrix={currentVariantMatrix}
      onSelectType={(type) => void openPricingForVariant("", String(type.id))}
      onSelectVariant={(variant) => void openPricingForVariant(String(variant.id))}
      onUpdateMatrix={setVariantStone}
      onOpenStones={() => void openSection("stones")}
      onOpenEditorMatrix={() => void openJewelryEditorSubview("matrix")}
      getTypeName={adminConstructorTypeName}
      getVariantName={adminConstructorVariantName}
      getStoneName={adminConstructorStoneName}
    />
  );

  return (
    <AdminShell title="������������� �����" subtitle="³������� CMS �� JSON ��� ����, �������, �����, ������� � �����.">
      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}
      {!studio ? <div className="empty-state-react"><h2>������������ �����</h2></div> : (
        <div className="studio-shell">
          <StudioWorkspaceBar sections={workspaceSections} currentSection={section} breadcrumbs={breadcrumbs} onOpenSection={openSection} />
          <StudioWorkspaceMainPanel
            section={section}
            jewelryStep={jewelryStep}
            stoneStep={stoneStep}
            home={homeSectionPanel}
            jewelryTypes={jewelryTypeStepPanel}
            jewelryVariants={jewelryVariantStepPanel}
            jewelryEditor={jewelryEditorPanel}
            stonesList={stonesListPanel}
            stoneEditor={stoneEditorPanel}
            assets={assetsPanel}
            pricing={pricingPanel}
          />
        </div>
      )}
    </AdminShell>
  );
}

function AuroraBackground() {
  return (
    <div id="aurora-bg" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="orb orb-5" />
      <div className="orb orb-6" />
    </div>
  );
}

export default function AdminConstructorRoute() {
  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <StudioAdminConstructorPage />
      </div>
    </>
  );
}
