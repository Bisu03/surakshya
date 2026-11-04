import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { hasPermission } from "@/lib/permissions";

export async function requirePermission(resource, action = "view") {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      response: NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (!hasPermission(session.user, resource, action)) {
    return {
      response: NextResponse.json(
        { success: false, message: "You do not have permission to perform this action" },
        { status: 403 }
      ),
    };
  }

  return { session };
}

// Only requires an authenticated (logged-in) user, with no RBAC permission
// check. Used by the MRD section, which is open to every user.
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      response: NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  return { session };
}

// Requires the user to be an administrator. Used for MRD deletions, which are
// restricted to admins regardless of RBAC permissions.
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      response: NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== "Admin") {
    return {
      response: NextResponse.json(
        { success: false, message: "Only administrators can perform this action" },
        { status: 403 }
      ),
    };
  }

  return { session };
}
