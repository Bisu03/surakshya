import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import { hasPathAccess } from "@/lib/permissions"

export default withAuth(
  function middleware(req) {
    if (!hasPathAccess(req.nextauth.token, req.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/dashboard/menu", req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => token !== null && token?.isActive !== false,
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/ipd/:path*",
    "/opd/:path*",
    "/patient/:path*",
    "/dashboard/:path*",
    "/inventory/:path*",
  ],
}

