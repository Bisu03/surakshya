export const hasPermission = (permissions, category, route, action) => {
    const categoryPermissions = permissions.find((perm) => perm.category === category);
    if (!categoryPermissions) return false;
  
    const routePermissions = categoryPermissions.routes.find(
      (r) => r.name === route || r.path === route
    );
    if (!routePermissions || !routePermissions.permissions) return false;
  
    return routePermissions.permissions.includes(action);
  };
  