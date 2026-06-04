// Файл містить логіку адмін-конструктора.
export const STUDIO_WORKSPACE_SECTIONS = [
  { key: "jewelry", label: "Прикраси", description: "Форми, варіанти, слоти й попередній перегляд." },
  { key: "stones", label: "Камені", description: "Повна бібліотека всіх доступних каменів." },
  { key: "assets", label: "Асети", description: "База зображень прикрас, каменів і вітрини." },
  { key: "pricing", label: "Ціни", description: "Доступність каменів і ціни за варіантами." }
];

export const STUDIO_JEWELRY_TYPE_OPTIONS = [
  ["ring", "Каблучки"],
  ["bracelet", "Браслети"],
  ["pendant", "Підвіски"],
  ["earrings", "Сережки"]
];

// Формує структуру build studio workspace breadcrumbs для UI, API-відповіді або подальших розрахунків.
export function buildStudioWorkspaceBreadcrumbs({
  section,
  jewelryStep,
  stoneStep,
  selectedTypeId,
  currentTypeAdmin,
  currentVariantAdmin,
  currentSlotAdmin,
  stoneForm,
  selectedTypeLabel,
  getTypeName,
  getVariantName,
  getStoneName,
  navigateAfterSlotPersist
}) {
  const breadcrumbs = [
    {
      key: "home",
      label: "Головна",
      isActive: section === "home",
      onClick: () => void navigateAfterSlotPersist({ section: "home" })
    }
  ];

  if (section === "jewelry") {
    breadcrumbs.push({
      key: "jewelry",
      label: "Прикраси",
      isActive: jewelryStep === "types",
      onClick: () => void navigateAfterSlotPersist({
        section: "jewelry",
        jewelryStep: "types",
        editorSubview: "slots",
        selectedVariantId: "",
        selectedSlotId: "",
        selectedStoneId: ""
      })
    });
    if (jewelryStep !== "types" && currentTypeAdmin) {
      breadcrumbs.push({
        key: `type-${currentTypeAdmin.id}`,
        label: selectedTypeLabel || getTypeName(currentTypeAdmin),
        isActive: jewelryStep === "variants",
        onClick: () => void navigateAfterSlotPersist({
          section: "jewelry",
          jewelryStep: "variants",
          selectedTypeId: String(currentTypeAdmin.id),
          selectedVariantId: "",
          selectedSlotId: "",
          selectedStoneId: ""
        })
      });
    }
    if (jewelryStep === "editor" && currentVariantAdmin) {
      breadcrumbs.push({
        key: `variant-${currentVariantAdmin.id}`,
        label: getVariantName(currentVariantAdmin, currentTypeAdmin?.code),
        isActive: true,
        onClick: () => void navigateAfterSlotPersist({
          section: "jewelry",
          jewelryStep: "editor",
          editorSubview: "slots",
          selectedTypeId: String(currentVariantAdmin.type_id),
          selectedVariantId: String(currentVariantAdmin.id),
          selectedSlotId: currentSlotAdmin?.id || "",
          selectedStoneId: ""
        })
      });
    }
    return breadcrumbs;
  }

  if (section === "stones") {
    breadcrumbs.push({
      key: "stones",
      label: "Камені",
      isActive: stoneStep === "list",
      onClick: () => void navigateAfterSlotPersist({ section: "stones", stoneStep: "list", selectedStoneId: "" })
    });
    if (stoneStep === "editor" && stoneForm) {
      breadcrumbs.push({
        key: `stone-${stoneForm.id || stoneForm.code || "new"}`,
        label: getStoneName(stoneForm, stoneForm.code || "Новий камінь"),
        isActive: true,
        onClick: () => void navigateAfterSlotPersist({
          section: "stones",
          stoneStep: "editor",
          selectedStoneId: stoneForm.id ? String(stoneForm.id) : "new"
        })
      });
    }
    return breadcrumbs;
  }

  if (section === "assets") {
    breadcrumbs.push({
      key: "assets",
      label: "Асети",
      isActive: true,
      onClick: () => void navigateAfterSlotPersist({ section: "assets" })
    });
    return breadcrumbs;
  }

  if (section === "pricing") {
    breadcrumbs.push({
      key: "pricing",
      label: "Ціни",
      isActive: !selectedTypeId,
      onClick: () => void navigateAfterSlotPersist({ section: "pricing", selectedTypeId: "", selectedVariantId: "" })
    });
    if (currentTypeAdmin) {
      breadcrumbs.push({
        key: `pricing-type-${currentTypeAdmin.id}`,
        label: selectedTypeLabel || getTypeName(currentTypeAdmin),
        isActive: Boolean(currentTypeAdmin && !currentVariantAdmin),
        onClick: () => void navigateAfterSlotPersist({
          section: "pricing",
          selectedTypeId: String(currentTypeAdmin.id),
          selectedVariantId: ""
        })
      });
    }
    if (currentVariantAdmin) {
      breadcrumbs.push({
        key: `pricing-variant-${currentVariantAdmin.id}`,
        label: getVariantName(currentVariantAdmin, currentTypeAdmin?.code),
        isActive: true,
        onClick: () => void navigateAfterSlotPersist({
          section: "pricing",
          selectedTypeId: String(currentVariantAdmin.type_id),
          selectedVariantId: String(currentVariantAdmin.id)
        })
      });
    }
  }

  return breadcrumbs;
}
