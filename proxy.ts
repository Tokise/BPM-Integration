import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
    const hostname = request.headers.get("host");
    const oldDomain = process.env.NEXT_PUBLIC_OLD_DOMAIN;
    const newSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (oldDomain && hostname === oldDomain && newSiteUrl) {
        const url = new URL(request.nextUrl.pathname + request.nextUrl.search, newSiteUrl);
        return NextResponse.redirect(url, 308);
    }

    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
