import React, { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { catalogApi } from "../api";
import {
  localizeProductFilterValue,
  productDisplayImage,
  productLocalizedName,
  productTypeLabel,
  referenceCopy
} from "../content";
import { normalizeCatalogPriceInput, validateCatalogPriceRange } from "../public-form-validation";
import { formatCurrency } from "../utils";
import { AuroraBackground, Footer, Header, LOCALE_FORMATS, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";
import "../styles/catalog-page.css";

const CATALOG_MULTI_FILTER_KEYS = [
  "metal",
  "stoneType",
  "stoneShape",
  "stoneColor",
  "stoneSize",
  "ringSize",
  "ringType",
  "braceletLength"
];

const CATALOG_TYPE_FILTERS = new Set(["Ring", "Earrings", "Bracelet", "Pendant"]);

function createEmptyCatalogFilterState() {
  return {
    metal: [],
    stoneType: [],
    stoneShape: [],
    stoneColor: [],
    stoneSize: [],
    ringSize: [],
    ringType: [],
    braceletLength: [],
    priceMin: "",
    priceMax: "",
    sort: "default"
  };
}

function parseCatalogNumericToken(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(",", ".");
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function sortCatalogFacetValues(values = [], key, locale) {
  const normalizedLocale = locale === "uk" ? "uk-UA" : "en-US";
  const numericKeys = new Set(["ringSize", "braceletLength", "stoneSize"]);

  return [...values].sort((left, right) => {
    if (numericKeys.has(key)) {
      const diff = parseCatalogNumericToken(left) - parseCatalogNumericToken(right);
      if (diff !== 0) return diff;
    }

    return localizeProductFilterValue(left, locale).localeCompare(localizeProductFilterValue(right, locale), normalizedLocale);
  });
}

function getCatalogTypeFromSearch() {
  const queryType = new URLSearchParams(window.location.search).get("type");
  return CATALOG_TYPE_FILTERS.has(queryType) ? queryType : "all";
}

function getCatalogUiCopy(locale = "uk") {
  return locale === "uk"
    ? {
        all: "Усі",
        rings: "Каблучки",
        bracelets: "Браслети",
        pendants: "Підвіски",
        earrings: "Сережки",
        filters: "Фільтри",
        found: "Знайдено",
        items: "виробів",
        reset: "Скинути фільтри",
        sort: "Сортування",
        sortDefault: "За замовчуванням",
        sortPriceAsc: "Ціна: від нижчої до вищої",
        sortPriceDesc: "Ціна: від вищої до нижчої",
        sortNewest: "Новинки",
        priceRange: "Діапазон ціни",
        from: "Від",
        to: "До",
        noResults: "За обраними фільтрами прикрас не знайдено.",
        noResultsText: "Спробуйте змінити фільтри або перейти в конструктор.",
        categoryFiltersTitle: "Фільтри колекції",
        showResults: "Показати вироби",
        closeFilters: "Закрити фільтри",
        noProducts: "Колекція ще готується",
        noProductsText: "Спробуйте повернутися пізніше або перейдіть у конструктор."
      }
    : {
        all: "All",
        rings: "Rings",
        bracelets: "Bracelets",
        pendants: "Pendants",
        earrings: "Earrings",
        filters: "Filters",
        found: "Found",
        items: "pieces",
        reset: "Reset filters",
        sort: "Sort",
        sortDefault: "Default",
        sortPriceAsc: "Price: low to high",
        sortPriceDesc: "Price: high to low",
        sortNewest: "New arrivals",
        priceRange: "Price range",
        from: "From",
        to: "To",
        noResults: "No jewelry matched the selected filters.",
        noResultsText: "Try changing filters or move into the constructor.",
        categoryFiltersTitle: "Collection filters",
        showResults: "Show pieces",
        closeFilters: "Close filters",
        noProducts: "The collection is being prepared",
        noProductsText: "Please check back soon or move into the constructor."
      };
}

function CatalogFacetGroup({ title, options, selectedValues, onToggle, locale }) {
  if (!options.length) return null;

  return (
    <section className="catalog-filter-group">
      <div className="catalog-filter-group-title">{title}</div>
      <div className="catalog-filter-options">
        {options.map((option) => {
          const isActive = selectedValues.includes(option);
          return (
            <button
              key={option}
              type="button"
              className={`catalog-filter-chip${isActive ? " active" : ""}`}
              onClick={() => onToggle(option)}
            >
              <span>{localizeProductFilterValue(option, locale)}</span>
              {isActive ? <Check size={14} strokeWidth={2.4} /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CatalogPage({ locale }) {
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [facetData, setFacetData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeType, setActiveType] = useState(() => getCatalogTypeFromSearch());
  const [catalogFilters, setCatalogFilters] = useState(() => createEmptyCatalogFilterState());
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const loadMoreRef = React.useRef(null);
  const copy = referenceCopy(locale);
  const catalogUi = getCatalogUiCopy(locale);
  const priceRangeValidation = useMemo(
    () => validateCatalogPriceRange({ priceMin: catalogFilters.priceMin, priceMax: catalogFilters.priceMax }, locale),
    [catalogFilters.priceMin, catalogFilters.priceMax, locale]
  );
  const catalogQuery = useMemo(
    () => {
      const nextQuery = {
        ...(activeType === "all" ? {} : { type: activeType }),
        ...catalogFilters
      };
      if (!priceRangeValidation.isValid) {
        nextQuery.priceMin = "";
        nextQuery.priceMax = "";
      }
      return nextQuery;
    },
    [activeType, catalogFilters, priceRangeValidation.isValid]
  );
  const catalogQuerySignature = useMemo(() => JSON.stringify({ locale, ...catalogQuery }), [catalogQuery, locale]);

  useEffect(() => {
    let active = true;
    setLoadError("");
    setIsLoadingProducts(true);

    catalogApi
      .listProducts({ ...catalogQuery, page: 1, limit: 12 })
      .then((result) => {
        if (!active) return;
        setProducts(result?.items || []);
        setPageInfo(result?.pageInfo || null);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setIsLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, [catalogQuerySignature]);

  useEffect(() => {
    let active = true;
    catalogApi
      .listProductFacets(catalogQuery)
      .then((result) => {
        if (active) setFacetData(result || null);
      })
      .catch(() => {
        if (active) setFacetData(null);
      });
    return () => {
      active = false;
    };
  }, [catalogQuerySignature]);

  useEffect(() => {
    if (!isMobileFiltersOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileFiltersOpen]);

  useEffect(() => {
    const syncFromUrl = () => setActiveType(getCatalogTypeFromSearch());
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeType === "all") {
      url.searchParams.delete("type");
    } else {
      url.searchParams.set("type", activeType);
    }
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) window.history.replaceState({}, "", nextUrl);
  }, [activeType]);

  const categoryFilters = [
    { id: "all", label: catalogUi.all },
    { id: "Ring", label: catalogUi.rings },
    { id: "Bracelet", label: catalogUi.bracelets },
    { id: "Pendant", label: catalogUi.pendants },
    { id: "Earrings", label: catalogUi.earrings }
  ];

  const sortOptions = [
    { value: "default", label: catalogUi.sortDefault },
    { value: "price_asc", label: catalogUi.sortPriceAsc },
    { value: "price_desc", label: catalogUi.sortPriceDesc },
    { value: "newest", label: catalogUi.sortNewest }
  ];

  const priceBounds = facetData?.priceBounds || { min: 0, max: 0 };
  const visibleProducts = products;

  const filterDefinitions = useMemo(() => {
    const definitions = [
      { key: "metal", label: locale === "uk" ? "Метал" : "Metal" },
      { key: "stoneType", label: locale === "uk" ? "Камінь" : "Stone" },
      { key: "stoneShape", label: locale === "uk" ? "Огранювання" : "Stone cut" },
      { key: "stoneColor", label: locale === "uk" ? "Колір каменю" : "Stone color" },
      { key: "stoneSize", label: locale === "uk" ? "Розмір каменю" : "Stone size" }
    ];

    if (activeType === "Ring") {
      definitions.push(
        { key: "ringSize", label: locale === "uk" ? "Розмір каблучки" : "Ring size" },
        { key: "ringType", label: locale === "uk" ? "Стиль каблучки" : "Ring style" }
      );
    }

    if (activeType === "Bracelet") {
      definitions.push({ key: "braceletLength", label: locale === "uk" ? "Довжина браслета" : "Bracelet length" });
    }

    return definitions
      .map((definition) => {
        const options = sortCatalogFacetValues(facetData?.facets?.[definition.key] || [], definition.key, locale);
        return { ...definition, options };
      })
      .filter((definition) => definition.options.length);
  }, [activeType, facetData, locale]);

  const hasActiveFilters = useMemo(() => {
    if (activeType !== "all") return true;
    if (catalogFilters.sort !== "default") return true;
    if (catalogFilters.priceMin !== "" || catalogFilters.priceMax !== "") return true;
    return CATALOG_MULTI_FILTER_KEYS.some((key) => (catalogFilters[key] || []).length > 0);
  }, [activeType, catalogFilters]);

  function handleTypeChange(typeId) {
    setActiveType(typeId);
    setCatalogFilters((current) => ({
      ...current,
      ringSize: typeId === "Ring" ? current.ringSize : [],
      ringType: typeId === "Ring" ? current.ringType : [],
      braceletLength: typeId === "Bracelet" ? current.braceletLength : []
    }));
  }

  function toggleFilterValue(key, value) {
    setCatalogFilters((current) => {
      const selectedValues = current[key] || [];
      const nextValues = selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value];
      return { ...current, [key]: nextValues };
    });
  }

  function resetCatalogFilters() {
    setActiveType("all");
    setCatalogFilters(createEmptyCatalogFilterState());
    setIsMobileFiltersOpen(false);
  }

  async function loadNextCatalogPage() {
    if (!pageInfo?.hasNextPage || isLoadingMore || isLoadingProducts) return;
    setIsLoadingMore(true);
    setLoadError("");
    try {
      const result = await catalogApi.listProducts({ ...catalogQuery, page: pageInfo.page + 1, limit: pageInfo.limit || 12 });
      setProducts((current) => [...current, ...(result?.items || [])]);
      setPageInfo(result?.pageInfo || null);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !pageInfo?.hasNextPage || isLoadingMore || isLoadingProducts) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadNextCatalogPage();
    }, { rootMargin: "320px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [catalogQuerySignature, pageInfo?.hasNextPage, pageInfo?.page, isLoadingMore, isLoadingProducts]);

  function renderFiltersContent(isDrawer = false) {
    return (
      <div className={`catalog-filters-surface${isDrawer ? " is-drawer" : ""}`}>
        <div className="catalog-filters-surface-head">
          <div>
            <p className="catalog-filters-kicker">{catalogUi.filters}</p>
            <h2>{catalogUi.categoryFiltersTitle}</h2>
          </div>
          <div className="catalog-filters-head-actions">
            {hasActiveFilters ? (
              <button type="button" className="catalog-reset-button" onClick={resetCatalogFilters}>{catalogUi.reset}</button>
            ) : null}
            {isDrawer ? (
              <button type="button" className="catalog-drawer-close" onClick={() => setIsMobileFiltersOpen(false)} aria-label={catalogUi.closeFilters}>
                <X size={18} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="catalog-filters-scroll">
          {filterDefinitions.map((definition) => (
            <CatalogFacetGroup
              key={definition.key}
              title={definition.label}
              options={definition.options}
              selectedValues={catalogFilters[definition.key] || []}
              onToggle={(value) => toggleFilterValue(definition.key, value)}
              locale={locale}
            />
          ))}

          <section className="catalog-filter-group">
            <div className="catalog-filter-group-title">{catalogUi.priceRange}</div>
            <div className="catalog-price-grid">
              <label className="catalog-price-field">
                <span>{catalogUi.from}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-invalid={!priceRangeValidation.isValid}
                  value={catalogFilters.priceMin}
                  onChange={(event) => setCatalogFilters((current) => ({ ...current, priceMin: normalizeCatalogPriceInput(event.target.value) }))}
                  placeholder={priceBounds.min ? String(priceBounds.min) : "0"}
                />
              </label>
              <label className="catalog-price-field">
                <span>{catalogUi.to}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-invalid={!priceRangeValidation.isValid}
                  value={catalogFilters.priceMax}
                  onChange={(event) => setCatalogFilters((current) => ({ ...current, priceMax: normalizeCatalogPriceInput(event.target.value) }))}
                  placeholder={priceBounds.max ? String(priceBounds.max) : "0"}
                />
              </label>
            </div>
            {!priceRangeValidation.isValid ? <small className="form-field-error">{priceRangeValidation.error}</small> : null}
          </section>
        </div>

        {isDrawer ? (
          <div className="catalog-drawer-footer">
            {hasActiveFilters ? (
              <button type="button" className="catalog-drawer-secondary" onClick={resetCatalogFilters}>{catalogUi.reset}</button>
            ) : null}
            <button type="button" className="button catalog-drawer-apply" onClick={() => setIsMobileFiltersOpen(false)}>
              {catalogUi.showResults}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <main className="page-main">
      <div className="page-header">
        <div className="section-inner">
          <p className="eyebrow">{copy.catalogEyebrow}</p>
          <h1 className="page-title">{copy.catalogTitle}</h1>
        </div>
      </div>

      <div className="catalog-trust-strip">
        <div className="section-inner">
          <div className="catalog-trust-items">
            {[copy.handcraftedFinish, copy.transparentPricing, copy.personalApproach].map((item) => (
              <div key={item} className="catalog-trust-item">
                <span className="catalog-trust-dot" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-inner" style={{ paddingTop: "2rem" }}>
        <div className="filter-bar">
          {categoryFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`filter-pill${activeType === filter.id ? " active" : ""}`}
              onClick={() => handleTypeChange(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loadError ? <p className="load-error">{loadError}</p> : null}

        <div className="catalog-mobile-actions">
          <button type="button" className="catalog-mobile-filter-button" onClick={() => setIsMobileFiltersOpen(true)}>
            {catalogUi.filters}
          </button>
        </div>

        <div className="catalog-layout">
          <aside className="catalog-filters-column">{renderFiltersContent(false)}</aside>

          <div className="catalog-results-column">
            <div className="catalog-toolbar">
              <div className="catalog-toolbar-meta">
                <strong>{catalogUi.found}</strong>
                <span>{pageInfo?.totalItems ?? visibleProducts.length} {catalogUi.items}</span>
              </div>
              <div className="catalog-toolbar-actions">
                {hasActiveFilters ? (
                  <button type="button" className="catalog-toolbar-reset" onClick={resetCatalogFilters}>{catalogUi.reset}</button>
                ) : null}
                <label className="catalog-sort-control">
                  <span>{catalogUi.sort}</span>
                  <select
                    value={catalogFilters.sort}
                    onChange={(event) => setCatalogFilters((current) => ({ ...current, sort: event.target.value }))}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {isLoadingProducts && !visibleProducts.length ? (
              <div className="empty-state-react catalog-empty-state">
                <h3>{locale === "uk" ? "Завантажуємо колекцію" : "Loading the collection"}</h3>
                <p>{locale === "uk" ? "Показуємо тільки потрібну частину каталогу." : "Only the needed catalog slice is being loaded."}</p>
              </div>
            ) : visibleProducts.length ? (
              <div className="product-grid">
                {visibleProducts.map((product, index) => (
                  <a className="product-card" href={`/products/${product.slug}`} key={product.id || product.slug}>
                    <div className="product-card-img">
                      <img
                        src={productDisplayImage(product, index)}
                        alt={productLocalizedName(product, locale)}
                        loading={index < 4 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    </div>
                    <div className="product-card-body">
                      <div className="product-card-type">{productTypeLabel(product, locale)}</div>
                      <div className="product-card-name">{productLocalizedName(product, locale)}</div>
                      <div className="product-card-material">
                        {localizeProductFilterValue(product.filters?.metal, locale) || (locale === "uk" ? "Авторська прикраса" : "Signature piece")}
                      </div>
                      <div className="product-card-price">{formatCurrency(product.price, product.currency, LOCALE_FORMATS[locale])}</div>
                    </div>
                  </a>
                ))}
              </div>
            ) : hasActiveFilters ? (
              <div className="empty-state-react catalog-empty-state">
                <h3>{catalogUi.noResults}</h3>
                <p>{catalogUi.noResultsText}</p>
                <button type="button" className="small-button is-active" onClick={resetCatalogFilters}>{catalogUi.reset}</button>
              </div>
            ) : (
              <div className="empty-state-react catalog-empty-state">
                <h3>{catalogUi.noProducts}</h3>
                <p>{catalogUi.noProductsText}</p>
              </div>
            )}

            {pageInfo?.hasNextPage ? (
              <div className="catalog-load-more" ref={loadMoreRef}>
                <button type="button" className="small-button is-active" onClick={loadNextCatalogPage} disabled={isLoadingMore}>
                  {isLoadingMore ? (locale === "uk" ? "Завантаження..." : "Loading...") : (locale === "uk" ? "Показати ще" : "Show more")}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {isMobileFiltersOpen ? (
          <div className="catalog-drawer-shell" role="dialog" aria-modal="true" aria-label={catalogUi.filters}>
            <button type="button" className="catalog-drawer-backdrop" onClick={() => setIsMobileFiltersOpen(false)} aria-label={catalogUi.closeFilters} />
            <div className="catalog-drawer-panel">{renderFiltersContent(true)}</div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function CatalogRoute() {
  const { locale, toggleLocale } = usePublicLocale();

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <CatalogPage locale={locale} />
        <Footer locale={locale} />
      </div>
    </>
  );
}
