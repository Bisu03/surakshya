export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete"];

export const PERMISSION_RESOURCES = [
  { key: "dashboard", label: "Dashboard", category: "Dashboard", actions: ["view"] },
  { key: "patient", label: "Patients", category: "Patient", actions: PERMISSION_ACTIONS },
  { key: "ipd", label: "IPD Admission & Records", category: "IPD", actions: [...PERMISSION_ACTIONS, "print"] },
  { key: "ipd_billing", label: "IPD Services & Billing", category: "IPD", actions: ["view", "edit", "finalize", "print"] },
  { key: "discharge", label: "Discharge", category: "IPD", actions: PERMISSION_ACTIONS },
  { key: "money_receipt", label: "Money Receipt", category: "IPD", actions: PERMISSION_ACTIONS },
  { key: "opd", label: "OPD", category: "OPD", actions: [...PERMISSION_ACTIONS, "print"] },
  { key: "laboratory", label: "Laboratory", category: "Labtest", actions: [...PERMISSION_ACTIONS, "print"] },
  { key: "consultant_fee", label: "Consultant Fee", category: "Consultant Fee", actions: PERMISSION_ACTIONS },
  { key: "doctors", label: "Doctors & Summaries", category: "Doctor Summary", actions: PERMISSION_ACTIONS },
  { key: "reports", label: "Reports", category: "Report", actions: ["view", "print"] },
  { key: "expenses", label: "Expenses", category: "Expense", actions: PERMISSION_ACTIONS },
  { key: "services", label: "Services", category: "Services", actions: PERMISSION_ACTIONS },
  { key: "inventory", label: "Inventory", category: "Inventory", actions: [...PERMISSION_ACTIONS, "print"] },
  { key: "administration", label: "Administration", category: "Admin", actions: PERMISSION_ACTIONS },
  { key: "users", label: "Users & Permissions", category: "Admin", actions: ["view", "create", "edit", "delete", "manage_permissions"] },
];

const PATH_RESOURCES = [
  ["/admin/settings/users", "users", "view"],
  ["/admin/settings/permission", "users", "manage_permissions"],
  ["/admin/medicine", "inventory", "view"],
  ["/admin/services", "services", "view"],
  ["/admin", "administration", "view"],
  ["/ipd/billprint", "ipd_billing", "print"],
  ["/ipd/estimateprint", "ipd_billing", "print"],
  ["/ipd/ipdservice", "ipd_billing", "view"],
  ["/ipd/bill", "ipd_billing", "view"],
  ["/ipd/print", "ipd", "print"],
  ["/ipd", "ipd", "view"],
  ["/discharge", "discharge", "view"],
  ["/moneyreceipt", "money_receipt", "view"],
  ["/patient", "patient", "view"],
  ["/opd", "opd", "view"],
  ["/labtest", "laboratory", "view"],
  ["/labreport", "laboratory", "view"],
  ["/consultantfee", "consultant_fee", "view"],
  ["/doctor", "doctors", "view"],
  ["/doctorsummary", "doctors", "view"],
  ["/report", "reports", "view"],
  ["/expense", "expenses", "view"],
  ["/inventory", "inventory", "view"],
  ["/dashboard", "dashboard", "view"],
];

export function resourceForPath(pathname = "") {
  return PATH_RESOURCES.find(([prefix]) => pathname.startsWith(prefix))?.[1];
}

export function hasPathAccess(user, pathname) {
  // MRD (Medical Records) is open to every authenticated user; only deletions
  // are restricted to admins (enforced in the MRD API routes and UI).
  if (pathname.startsWith("/ipd/mrd")) return true;

  const permission = PATH_RESOURCES.find(([prefix]) => pathname.startsWith(prefix));
  return permission
    ? hasPermission(user, permission[1], permission[2] || "view")
    : true;
}

export function normalizePermissions(permissions = [], pageAccess = []) {
  if (Array.isArray(permissions) && permissions.length > 0) {
    return permissions
      .filter((permission) => permission?.resource && Array.isArray(permission.actions))
      .map((permission) => ({
        resource: permission.resource,
        actions: [...new Set(permission.actions)],
      }));
  }

  if (!Array.isArray(pageAccess)) return [];

  return PERMISSION_RESOURCES.filter((resource) =>
    pageAccess.includes(resource.category)
  ).map((resource) => ({ resource: resource.key, actions: ["view"] }));
}

export function hasPermission(user, resource, action = "view") {
  if (user?.role === "Admin") return true;
  if (!user?.isActive && user?.isActive !== undefined) return false;

  const permissions = normalizePermissions(user?.permissions, user?.pageAccess);
  return permissions.some(
    (permission) =>
      permission.resource === resource && permission.actions.includes(action)
  );
}

export function hasCategoryAccess(user, category) {
  if (user?.role === "Admin") return true;
  return PERMISSION_RESOURCES.some(
    (resource) =>
      resource.category === category && hasPermission(user, resource, "view")
  );
}

export function sanitizePermissions(permissions = []) {
  const resources = new Map(
    PERMISSION_RESOURCES.map((resource) => [resource.key, resource.actions])
  );

  return normalizePermissions(permissions)
    .filter((permission) => resources.has(permission.resource))
    .map((permission) => ({
      resource: permission.resource,
      actions: permission.actions.filter((action) =>
        resources.get(permission.resource).includes(action)
      ),
    }))
    .filter((permission) => permission.actions.length > 0);
}
