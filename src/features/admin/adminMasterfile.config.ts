export type AdminMasterfileResourceKey = "caseTypes" | "linkedCaseTypes" | "entityTypes";

export type AdminMasterfileConfig = {
  resourceKey: AdminMasterfileResourceKey;
  label: string;
  singularLabel: string;
  endpoint: string;
  routePath: string;
  description: string;
  listKeys: string[];
  objectKeys: string[];
  requiresCaseType?: boolean;
};

export const adminMasterfileConfigs: Record<AdminMasterfileResourceKey, AdminMasterfileConfig> = {
  caseTypes: {
    resourceKey: "caseTypes",
    label: "Case Types",
    singularLabel: "Case Type",
    endpoint: "/api/admin/case-types",
    routePath: "case-types",
    description: "Manage the primary case categories used for analysis routing.",
    listKeys: ["caseTypes", "caseType", "items", "records", "data"],
    objectKeys: ["caseType", "record", "item", "data"],
  },
  linkedCaseTypes: {
    resourceKey: "linkedCaseTypes",
    label: "Linked Case Types",
    singularLabel: "Linked Case Type",
    endpoint: "/api/admin/linked-case-types",
    routePath: "linked-case-types",
    description: "Manage case sub-types such as comparison, policy analysis, record of advice, and AGM pack.",
    listKeys: ["linkedCaseTypes", "linkedCaseType", "items", "records", "data"],
    objectKeys: ["linkedCaseType", "record", "item", "data"],
    requiresCaseType: true,
  },
  entityTypes: {
    resourceKey: "entityTypes",
    label: "Entity Types",
    singularLabel: "Entity Type",
    endpoint: "/api/admin/entity-types",
    routePath: "entity-types",
    description: "Manage supported entity classifications.",
    listKeys: ["entityTypes", "entityType", "items", "records", "data"],
    objectKeys: ["entityType", "record", "item", "data"],
  },
};

export function getAdminMasterfileConfig(resourceKey: AdminMasterfileResourceKey) {
  return adminMasterfileConfigs[resourceKey];
}
