import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(
    request.url,
  );
  const code = searchParams.get("code");

  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } =
      await supabase.auth.exchangeCodeForSession(
        code,
      );
    if (!error) {
      const forwardedHost = request.headers.get(
        "x-forwarded-host",
      );
      const cleanHost = forwardedHost
        ?.split(",")[0]
        ?.trim();

      // Fetch user profile to check role
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let finalNext = next;

      if (user) {
        const { data: profile } = await supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .select("roles(name), department:departments!profiles_department_id_fkey(code)")
          .eq("id", user.id)
          .single();

        const profileRole = (profile as any)?.roles?.name;

        if (profile && profileRole) {
          if (
            profileRole === "customer" &&
            next &&
            next !== "/"
          ) {
            finalNext = next;
          } else {
            const roleStr = profileRole.toLowerCase();
            // Supabase types might infer related tables as arrays depending on relationships
            const deptObj = Array.isArray(profile.department) 
              ? profile.department[0] 
              : profile.department;
            const deptCode = deptObj?.code as string | undefined;

            switch (roleStr) {
              case "admin":
                finalNext = "/core/transaction3/admin";
                break;
              case "logistics":
                if (deptCode === "LOG_DEPT1") {
                  finalNext = "/logistic/dept1";
                } else if (deptCode === "LOG_DEPT2") {
                  finalNext = "/logistic/dept2";
                } else {
                  finalNext = "/logistic"; // Fallback
                }
                break;
              case "hr":
                if (deptCode?.startsWith("HR_DEPT")) {
                  const deptNumber = deptCode.split("_")[1].toLowerCase(); // e.g., 'dept1'
                  finalNext = `/hr/${deptNumber}`;
                } else {
                  finalNext = "/hr"; // Fallback
                }
                break;
              case "finance":
                finalNext = "/finance";
                break;
              case "seller":
                finalNext = "/core/transaction2/seller";
                break;
              default:
                finalNext = next || "/";
            }
          }
        } else {
          finalNext = next || "/";
        }
      }

      (await cookies()).set(
        "app_toast_message",
        "Login successful",
        {
          path: "/",
          maxAge: 60,
        },
      );

      const isLocalEnv =
        process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(
          `${origin}${finalNext}`,
        );
      } else if (cleanHost) {
        return NextResponse.redirect(
          `https://${cleanHost}${finalNext}`,
        );
      } else {
        return NextResponse.redirect(
          `${origin}${finalNext}`,
        );
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/auth/auth-code-error`,
  );
}
