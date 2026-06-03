// Файл містить логіку адмін-конструктора.
// Формує структуру build jewelry slots section props для UI, API-відповіді або подальших розрахунків.
export function buildJewelrySlotsSectionProps(options) {
  return {
    currentVariantAdmin: options.currentVariantAdmin,
    currentTypeAdmin: options.currentTypeAdmin,
    currentVariantPreview: options.currentVariantPreview,
    currentVariantEditorBaseAsset: options.currentVariantEditorBaseAsset,
    currentSlots: options.currentSlots,
    currentSlot: options.currentSlot,
    slotForm: options.slotForm,
    slotDraftDirty: options.slotDraftDirty,
    slotSaveStatus: options.slotSaveStatus,
    slotSaveStatusLabel: options.slotSaveStatusLabel,
    selectedPreviewStoneCode: options.selectedPreviewStoneCode,
    availablePreviewStones: options.availablePreviewStones,
    editableSlots: options.editableSlots,
    stonesByCode: options.stonesByCode,
    previewSelections: options.previewSelections,
    isSaving: options.isSaving,
    displayedY: options.displayedY,
    onOpenStones: options.onOpenStones,
    onBackToVariants: options.onBackToVariants,
    onStartNewSlot: options.onStartNewSlot,
    onDuplicateSlot: options.onDuplicateSlot,
    onDeleteSlot: options.onDeleteSlot,
    onSaveSlot: options.onSaveSlot,
    onSelectSlot: options.onSelectSlot,
    onPreviewStonePick: options.onPreviewStonePick,
    onCanvasInteractionStart: options.onCanvasInteractionStart,
    onCanvasMoveSlot: options.onCanvasMoveSlot,
    onCanvasResizeSlot: options.onCanvasResizeSlot,
    onCanvasRotateSlot: options.onCanvasRotateSlot,
    onCanvasInteractionEnd: options.onCanvasInteractionEnd,
    onSlotFieldChange: options.onSlotFieldChange,
    getVariantName: options.getVariantName,
    getSlotName: options.getSlotName,
    getStoneName: options.getStoneName
  };
}

// Формує структуру build jewelry basic section props для UI, API-відповіді або подальших розрахунків.
export function buildJewelryBasicSectionProps(options) {
  return {
    typeForm: options.typeForm,
    variantForm: options.variantForm,
    assets: options.assets,
    currentTypeAdmin: options.currentTypeAdmin,
    currentVariantAdmin: options.currentVariantAdmin,
    selectedTypeId: options.selectedTypeId,
    isSaving: options.isSaving,
    isDeletePending: options.isDeletePending,
    onBackToVariants: options.onBackToVariants,
    onCreateVariant: options.onCreateVariant,
    onDeleteVariant: options.onDeleteVariant,
    onConfirmDeleteVariant: options.onConfirmDeleteVariant,
    onDeleteType: options.onDeleteType,
    onConfirmDeleteType: options.onConfirmDeleteType,
    onCancelDelete: options.onCancelDelete,
    onSaveVariant: options.onSaveVariant,
    onSaveType: options.onSaveType,
    onSetVariantForm: options.onSetVariantForm,
    onUpdateTypeField: options.onUpdateTypeField,
    onUpdateTypeMaterial: options.onUpdateTypeMaterial,
    onAddTypeMaterial: options.onAddTypeMaterial,
    onRemoveTypeMaterial: options.onRemoveTypeMaterial,
    onUpdateTypeSize: options.onUpdateTypeSize,
    onAddTypeSize: options.onAddTypeSize,
    onRemoveTypeSize: options.onRemoveTypeSize,
    onUpdateEngravingField: options.onUpdateEngravingField
  };
}

// Формує структуру build jewelry preview section props для UI, API-відповіді або подальших розрахунків.
export function buildJewelryPreviewSectionProps(options) {
  return {
    currentVariantPreview: options.currentVariantPreview,
    currentVariantAdmin: options.currentVariantAdmin,
    currentSlots: options.currentSlots,
    stonesByCode: options.stonesByCode,
    previewSelections: options.previewSelections,
    availablePreviewStones: options.availablePreviewStones,
    onPreviewSelectionChange: options.onPreviewSelectionChange,
    getSlotName: options.getSlotName,
    getStoneName: options.getStoneName,
    getVariantAssetCandidates: options.getVariantAssetCandidates
  };
}
