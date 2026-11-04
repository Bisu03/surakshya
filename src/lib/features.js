// Modules that can be switched off for this hospital. A disabled module keeps
// its pages and APIs in the codebase; it is only hidden from the menus, tabs
// and dashboard. Set LAB_ENABLED to true to bring the laboratory back.
export const LAB_ENABLED = false;

// Route prefixes that belong to the laboratory (pathology / radiology) module.
const LAB_PATH_PREFIXES = [
  "/labtest",
  "/labreport",
  "/doctorsummary/lab",
  "/report/lab",
  "/pathologytest",
  "/radiology-not",
  "/admin/pathology",
  "/admin/radiology",
];

export function isHiddenPath(path = "") {
  return (
    !LAB_ENABLED && LAB_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

// Permission rows of hidden modules are left out of the permission screens.
// Permissions already saved on a user are kept as they are.
export function isHiddenResource(resourceKey) {
  return !LAB_ENABLED && resourceKey === "laboratory";
}

// Drops hidden routes, then any menu category left without routes.
export function withoutHiddenRoutes(links) {
  return links
    .map((link) => ({
      ...link,
      routes: link.routes.filter((route) => !isHiddenPath(route.path)),
    }))
    .filter((link) => link.routes.length > 0);
}
