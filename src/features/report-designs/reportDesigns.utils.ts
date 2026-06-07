import { ApiError } from "../../lib/api";
import { createDefaultReportTemplate } from "../reports/reportTemplate.defaults";
import { reportTemplateSchema, type ReportElement, type ReportTemplate } from "../reports/reports.types";
import type {
  ReportDataSource,
  ReportDataSourceFieldsResult,
  ReportDesign,
  ReportDesignBinding,
  ReportDesignComponent,
  SaveReportDesignInput,
  StructuredOutputSchema,
  StructuredOutputSchemaField,
} from "./reportDesigns.types";

export const DEFAULT_REPORT_DATA_SOURCE_KEY = "case_analysis";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readBoolean(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return false;
}

function readArray(payload: unknown, keys: string[]) {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      for (const nestedKey of keys) {
        const nestedValue = value[nestedKey];
        if (Array.isArray(nestedValue)) return nestedValue;
      }
    }
  }

  return [];
}

function readWarnings(payload: unknown) {
  return readArray(payload, ["warnings", "warningMessages"])
    .map((item) => (typeof item === "string" ? item.trim() : isRecord(item) ? readString(item, ["message", "warning"]) : ""))
    .filter(Boolean);
}

function flattenFieldItems(items: unknown[], sourceKey?: string, flattened: StructuredOutputSchemaField[] = []) {
  for (const item of items) {
    if (!isRecord(item)) continue;

    const path = readString(item, ["path", "fieldPath", "fullPath", "key", "name"]);
    const label = readString(item, ["label", "displayName", "title", "name", "key"]) || path;
    const description = readString(item, ["description", "helpText", "summary"]);
    const type = readString(item, ["type", "fieldType", "valueType", "dataType"]) || "string";
    const required = readBoolean(item, ["required", "isRequired"]);

    if (path) {
      flattened.push({
        path,
        label,
        description,
        type,
        required,
        sourceKey,
      });
    }

    const children = Array.isArray(item.fields)
      ? item.fields
      : Array.isArray(item.children)
        ? item.children
        : Array.isArray(item.properties)
          ? item.properties
          : [];

    if (children.length > 0) {
      flattenFieldItems(children, sourceKey, flattened);
    }
  }

  return flattened;
}

function hydrateTemplate(payload: unknown): ReportTemplate {
  const defaults = createDefaultReportTemplate();
  if (!isRecord(payload)) return defaults;

  const page = isRecord(payload.page) ? payload.page : {};
  const theme = isRecord(payload.theme) ? payload.theme : {};
  const coverPage = isRecord(payload.coverPage) ? payload.coverPage : {};

  return reportTemplateSchema.parse({
    ...defaults,
    ...payload,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name : defaults.name,
    isDefault: typeof payload.isDefault === "boolean" ? payload.isDefault : defaults.isDefault,
    version: typeof payload.version === "number" ? payload.version : defaults.version,
    page: {
      ...defaults.page,
      ...page,
    },
    theme: {
      ...defaults.theme,
      ...theme,
    },
    coverPage: {
      ...defaults.coverPage,
      ...coverPage,
      elements: Array.isArray(coverPage.elements) ? coverPage.elements : defaults.coverPage.elements,
    },
    sections: Array.isArray(payload.sections) ? payload.sections : defaults.sections,
    assets: Array.isArray(payload.assets) ? payload.assets : defaults.assets,
  });
}

export function normalizeStructuredOutputSchemas(payload: unknown): StructuredOutputSchema[] {
  return readArray(payload, ["schemas", "structuredOutputSchemas", "items", "data"])
    .map((item) => {
      if (!isRecord(item)) return null;

      const key = readString(item, ["schemaKey", "key", "name", "id", "_id"]);
      if (!key) return null;

      return {
        key,
        name: readString(item, ["label", "name", "title", "schemaName"]) || key,
        description: readString(item, ["description", "summary"]),
        version: readNumber(item, ["schemaVersion", "version"]),
        isActive: item.isActive !== false,
      };
    })
    .filter((item): item is StructuredOutputSchema => Boolean(item))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function normalizeReportDataSources(payload: unknown): ReportDataSource[] {
  return readArray(payload, ["sources", "dataSources", "reportDataSources", "items", "data"])
    .map((item) => {
      if (!isRecord(item)) return null;

      const key = readString(item, ["sourceKey", "key", "name", "id"]);
      if (!key) return null;

      return {
        key,
        name: readString(item, ["label", "name", "title"]) || key,
        description: readString(item, ["description", "summary"]),
        isActive: item.isActive !== false,
      };
    })
    .filter((item): item is ReportDataSource => Boolean(item))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function normalizeStructuredOutputSchemaFields(payload: unknown) {
  const container = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const version = isRecord(container) ? readNumber(container, ["schemaVersion", "version"]) : null;
  const items = readArray(container, ["fields", "items", "data"]);

  return {
    schemaVersion: version,
    fields: flattenFieldItems(items).sort((a, b) => a.path.localeCompare(b.path)),
  };
}

export function normalizeReportDataSourceFields(payload: unknown, fallbackSourceKey: string): ReportDataSourceFieldsResult {
  const container = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const sourceKey = isRecord(container) ? readString(container, ["sourceKey", "key"]) || fallbackSourceKey : fallbackSourceKey;
  const version = isRecord(container) ? readNumber(container, ["schemaVersion", "version"]) : null;
  const items = readArray(container, ["fields", "items", "data"]);
  const tree = isRecord(container) ? readArray(container, ["tree", "fieldTree"]) : [];

  return {
    sourceKey,
    schemaVersion: version,
    fields: flattenFieldItems(items, sourceKey).sort((a, b) => a.path.localeCompare(b.path)),
    tree,
    warnings: readWarnings(container),
  };
}

function normalizeReportDesignComponent(item: unknown): ReportDesignComponent | null {
  if (!isRecord(item)) return null;

  const id = readString(item, ["id", "_id", "componentId"]);
  const label = readString(item, ["label", "name", "title", "text", "value", "fieldKey", "path"]) || id;

  if (!id) return null;

  return {
    id,
    type: readString(item, ["type"]) || "text",
    label,
    fieldKey: readString(item, ["fieldKey", "path"]) || undefined,
    assetId: readString(item, ["assetId"]) || undefined,
    page: readString(item, ["page"]) || "cover",
    x: readNumber(item, ["x"]) ?? 48,
    y: readNumber(item, ["y"]) ?? 48,
    width: readNumber(item, ["width"]) ?? 240,
    height: readNumber(item, ["height"]) ?? 72,
    zIndex: readNumber(item, ["zIndex"]) ?? 1,
    locked: readBoolean(item, ["locked"]),
    content: readString(item, ["content", "text", "value"]) || undefined,
    style: {
      fontFamily: readString(item, ["fontFamily"]) || (isRecord(item.style) ? readString(item.style, ["fontFamily"]) : "") || undefined,
      fontSize: readNumber(item, ["fontSize"]) ?? (isRecord(item.style) ? readNumber(item.style, ["fontSize"]) : null) ?? 16,
      fontWeight: readString(item, ["fontWeight"]) || (isRecord(item.style) ? readString(item.style, ["fontWeight"]) : "") || "600",
      color: readString(item, ["color"]) || (isRecord(item.style) ? readString(item.style, ["color"]) : "") || "#18181b",
      backgroundColor: readString(item, ["backgroundColor"]) || (isRecord(item.style) ? readString(item.style, ["backgroundColor"]) : "") || "#ffffff",
      textAlign: ((readString(item, ["textAlign"]) || (isRecord(item.style) ? readString(item.style, ["textAlign"]) : "") || "left") as "left" | "center" | "right"),
      borderRadius: readNumber(item, ["borderRadius"]) ?? (isRecord(item.style) ? readNumber(item.style, ["borderRadius"]) : null) ?? 8,
      objectFit: ((readString(item, ["objectFit"]) || (isRecord(item.style) ? readString(item.style, ["objectFit"]) : "") || undefined) as "contain" | "cover" | "fill" | undefined),
      opacity: readNumber(item, ["opacity"]) ?? (isRecord(item.style) ? readNumber(item.style, ["opacity"]) : null) ?? 1,
    },
  };
}

function readDesignComponents(design: Record<string, unknown>) {
  const rootComponents = readArray(design, ["components", "items"]);
  if (rootComponents.length > 0) return rootComponents;

  return readArray(design, ["pages"]).flatMap((page) => {
    if (!isRecord(page)) return [];
    return readArray(page, ["components", "items"]);
  });
}

function normalizeReportDesignBinding(item: unknown): ReportDesignBinding | null {
  if (!isRecord(item)) return null;

  const componentId = readString(item, ["componentId", "id"]);
  const path = readString(item, ["path", "fieldPath"]);

  if (!componentId || !path) return null;

  return {
    componentId,
    sourceKey: readString(item, ["sourceKey", "source"]) || DEFAULT_REPORT_DATA_SOURCE_KEY,
    path,
    fallback: readString(item, ["fallback", "defaultValue"]),
  };
}

export function normalizeReportDesign(payload: unknown): ReportDesign {
  const container =
    isRecord(payload) && isRecord(payload.data)
      ? payload.data
      : isRecord(payload) && isRecord(payload.reportDesign)
        ? payload.reportDesign
        : payload;

  if (!isRecord(container)) {
    return {
      name: "",
      description: "",
      schemaKey: "",
      schemaVersion: null,
      design: { pages: [], components: [] },
      bindings: [],
    };
  }

  const design = isRecord(container.design) ? container.design : {};
  const rawBindings = readArray(container, ["bindings", "fieldBindings"]);
  const storedTemplate = isRecord(design.template) ? hydrateTemplate(design.template) : undefined;
  const components = readDesignComponents(design)
    .map(normalizeReportDesignComponent)
    .filter((item): item is ReportDesignComponent => Boolean(item));
  const hasMigratedBindings = rawBindings.some((item) => isRecord(item) && !readString(item, ["sourceKey", "source"]));
  const warnings = Array.from(new Set([...readWarnings(payload), ...readWarnings(container)]));

  return {
    id: readString(container, ["id", "_id"]) || undefined,
    _id: readString(container, ["_id"]) || undefined,
    name: readString(container, ["name"]),
    description: readString(container, ["description"]),
    schemaKey: readString(container, ["schemaKey"]),
    schemaVersion: readNumber(container, ["schemaVersion", "version"]),
    design: {
      pages: Array.isArray(design.pages) ? design.pages : [],
      components,
      template: storedTemplate,
    },
    bindings: rawBindings.map(normalizeReportDesignBinding).filter((item): item is ReportDesignBinding => Boolean(item)),
    isArchived: readBoolean(container, ["isArchived", "archived"]),
    createdAt: readString(container, ["createdAt"]) || undefined,
    updatedAt: readString(container, ["updatedAt"]) || undefined,
    hasMigratedBindings,
    warnings,
  };
}

export function normalizeReportDesigns(payload: unknown) {
  return readArray(payload, ["reportDesigns", "designs", "items", "data"])
    .map(normalizeReportDesign)
    .filter((item) => item.schemaKey && item.name);
}

export function getReportDesignId(design: Pick<ReportDesign, "id" | "_id">) {
  return design.id ?? design._id ?? "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function createUniqueComponentId(base: string, existingIds: string[]) {
  const root = slugify(base) || "component";
  let candidate = root;
  let index = 2;

  while (existingIds.includes(candidate)) {
    candidate = `${root}-${index}`;
    index += 1;
  }

  return candidate;
}

export function createComponentBindingFromField(
  field: StructuredOutputSchemaField,
  existingComponents: ReportDesignComponent[],
) {
  const componentId = createUniqueComponentId(field.label || field.path, existingComponents.map((component) => component.id));
  const component: ReportDesignComponent = {
    id: componentId,
    type: "field",
    label: field.label || field.path,
    fieldKey: field.path,
    page: "cover",
    x: 64,
    y: 64,
    width: 260,
    height: 72,
    zIndex: existingComponents.length + 1,
    style: {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: 16,
      fontWeight: "600",
      color: "#18181b",
      backgroundColor: "#ffffff",
      textAlign: "left",
      borderRadius: 8,
      opacity: 1,
    },
  };
  const binding: ReportDesignBinding = {
    componentId,
    sourceKey: field.sourceKey || DEFAULT_REPORT_DATA_SOURCE_KEY,
    path: field.path,
    fallback: "",
  };

  return { component, binding };
}

function componentToElement(component: ReportDesignComponent, binding: ReportDesignBinding | undefined): ReportElement {
  const fallbackContent = binding?.fallback === undefined || binding.fallback === null ? component.content : String(binding.fallback);

  return {
    id: component.id,
    type: (component.type === "image" || component.type === "shape" || component.type === "field" ? component.type : "text"),
    page: component.page ?? "cover",
    x: component.x ?? 48,
    y: component.y ?? 48,
    width: component.width ?? 240,
    height: component.height ?? 72,
    zIndex: component.zIndex ?? 1,
    locked: component.locked,
    content: component.type === "field" ? fallbackContent : component.content,
    fieldKey: component.type === "field" ? binding?.path ?? component.fieldKey : undefined,
    assetId: component.assetId,
    style: {
      fontFamily: component.style?.fontFamily,
      fontSize: component.style?.fontSize,
      fontWeight: component.style?.fontWeight,
      color: component.style?.color,
      backgroundColor: component.style?.backgroundColor,
      textAlign: component.style?.textAlign,
      borderRadius: component.style?.borderRadius,
      objectFit: component.style?.objectFit,
      opacity: component.style?.opacity,
    },
  };
}

function defaultComponentLabel(element: ReportElement) {
  if (element.type === "field") return element.fieldKey || "Field";
  if (element.type === "text") return element.content?.trim().split("\n")[0] || "Text";
  if (element.type === "image") return "Image";
  return "Shape";
}

function elementToComponent(element: ReportElement, binding: ReportDesignBinding | undefined): ReportDesignComponent {
  return {
    id: element.id,
    type: element.type,
    label: binding?.path || defaultComponentLabel(element),
    fieldKey: element.fieldKey,
    assetId: element.assetId,
    page: element.page,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex,
    locked: element.locked,
    content: element.type === "field" ? undefined : element.content,
    style: {
      fontFamily: element.style.fontFamily,
      fontSize: element.style.fontSize,
      fontWeight: element.style.fontWeight,
      color: element.style.color,
      backgroundColor: element.style.backgroundColor,
      textAlign: element.style.textAlign,
      borderRadius: element.style.borderRadius,
      objectFit: element.style.objectFit,
      opacity: element.style.opacity,
    },
  };
}

export function getReportDesignTemplate(design: ReportDesign): ReportTemplate {
  const template = hydrateTemplate(design.design.template);
  const bindingsById = new Map(design.bindings.map((binding) => [binding.componentId, binding]));
  const coverPageElements = design.design.components.length > 0
    ? design.design.components.map((component) => componentToElement(component, bindingsById.get(component.id)))
    : template.coverPage.elements;

  return {
    ...template,
    coverPage: {
      ...template.coverPage,
      elements: coverPageElements,
    },
  };
}

export function buildReportDesignDocument(
  template: ReportTemplate,
  bindings: ReportDesignBinding[],
  pages: Array<{ id: string; name: string }> = [{ id: "cover", name: "Cover" }],
) {
  const bindingsById = new Map(bindings.map((binding) => [binding.componentId, binding]));
  const components = template.coverPage.elements.map((element) => elementToComponent(element, bindingsById.get(element.id)));
  const normalizedPages = pages.some((page) => page.id === "cover") ? pages : [{ id: "cover", name: "Cover" }, ...pages];

  return {
    version: 1,
    page: {
      size: template.page.size,
      orientation: template.page.orientation,
      margin: {
        top: template.page.marginTop,
        right: template.page.marginRight,
        bottom: template.page.marginBottom,
        left: template.page.marginLeft,
      },
    },
    theme: template.theme,
    pages: normalizedPages.map((page) => ({
      id: page.id,
      name: page.name,
      size: template.page.size,
      orientation: template.page.orientation,
      components: components.filter((component) => (component.page ?? "cover") === page.id),
    })),
    components,
    template,
  };
}

export function buildSaveReportDesignInput(design: ReportDesign): SaveReportDesignInput | null {
  if (!design.name.trim() || !design.schemaKey.trim() || design.schemaVersion === null) {
    return null;
  }
  if (design.bindings.some((binding) => !binding.componentId.trim() || !binding.sourceKey.trim() || !binding.path.trim())) {
    return null;
  }

  return {
    name: design.name.trim(),
    description: design.description.trim(),
    schemaKey: design.schemaKey,
    schemaVersion: design.schemaVersion,
    design: {
      ...design.design,
      pages: Array.isArray(design.design.pages) && design.design.pages.length > 0
        ? design.design.pages
        : [{ id: "cover", name: "Cover", components: design.design.components }],
      components: design.design.components.map((component) => ({
        id: component.id,
        type: component.type || "text",
        label: component.label.trim(),
        fieldKey: component.fieldKey,
        assetId: component.assetId,
        page: component.page,
        x: component.x,
        y: component.y,
        width: component.width,
        height: component.height,
        zIndex: component.zIndex,
        locked: component.locked,
        content: component.content,
        style: component.style,
      })),
      template: design.design.template,
    },
    bindings: design.bindings.map((binding) => ({
      componentId: binding.componentId,
      sourceKey: binding.sourceKey,
      path: binding.path,
      fallback: binding.fallback,
    })),
    isArchived: design.isArchived,
  };
}

export function getSchemaMismatchMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    return "Report design schema does not match selected analysis schema.";
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function getSchemaDisplayName(schema: StructuredOutputSchema | undefined, schemaKey: string) {
  return schema?.name || schemaKey || "Unknown schema";
}

export function isAdminUser(user: unknown) {
  if (!isRecord(user)) return false;

  const role = readString(user, ["role"]);
  if (role.toLowerCase().includes("admin")) return true;

  const roles = user.roles;
  if (Array.isArray(roles)) {
    return roles.some((value) => typeof value === "string" && value.toLowerCase().includes("admin"));
  }

  return false;
}

export function getFieldTypeLabel(field: StructuredOutputSchemaField) {
  const parts = [field.type];
  if (field.required) parts.push("required");
  return parts.join(" | ");
}
