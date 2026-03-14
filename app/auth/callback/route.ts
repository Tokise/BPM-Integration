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
          .select("*, roles(name), department:departments!profiles_department_id_fkey(code)")
          .eq("id", user.id)
          .single();

        const profileData = profile as any;
        const rolesObj = profileData?.roles;
        const profileRole = rolesObj?.name || profileData?.role || "";

        if (profile && profileRole) {
          const roleStr = profileRole.toLowerCase();
          
          // 1. Determine the target dashboard based on role
          if (
            profileRole === "customer" &&
            next &&
            next !== "/"
          ) {
            finalNext = next;
          } else {
            // Supabase types might infer related tables as arrays depending on relationships
            const deptObj = Array.isArray(profile.department) 
              ? profile.department[0] 
              : profile.department;
            const deptCode = deptObj?.code as string | undefined;

            if (roleStr === "admin") {
              finalNext = "/core/transaction3/admin";
            } else if (roleStr === "seller") {
              finalNext = "/core/transaction2/seller";
            } else if (roleStr.startsWith("hr1_")) {
              finalNext = "/hr/dept1";
            } else if (roleStr.startsWith("hr2_")) {
              finalNext = "/hr/dept2";
            } else if (roleStr.startsWith("hr3_")) {
              finalNext = "/hr/dept3";
            } else if (roleStr.startsWith("hr4_")) {
              finalNext = "/hr/dept4";
            } else if (roleStr === "finance" || roleStr.startsWith("finance_")) {
              finalNext = "/finance";
            } else if (roleStr.startsWith("logistic1_")) {
              finalNext = "/logistic/dept1";
            } else if (roleStr === "logistic2_driver") {
              finalNext = "/logistic/dept2/driver";
            } else if (roleStr.startsWith("logistic2_")) {
              finalNext = "/logistic/dept2";
            } else if (roleStr === "hr" || roleStr === "logistics") {
              // Legacy fallbacks
              if (deptCode?.startsWith("HR_DEPT")) {
                const deptNumber = deptCode.split("_")[1].toLowerCase();
                finalNext = `/hr/${deptNumber}`;
              } else if (deptCode === "LOG_DEPT1") {
                finalNext = "/logistic/dept1";
              } else if (deptCode === "LOG_DEPT2") {
                finalNext = "/logistic/dept2";
              } else {
                finalNext = roleStr === "hr" ? "/hr" : "/logistic";
              }
            } else {
              finalNext = next || "/";
            }
          }

          // 2. Wrap in OTP verification if employee
          const isEmployee = !["customer", "seller"].includes(roleStr);
          if (isEmployee) {
            const { generateAndSendOTP } = await import("@/app/actions/auth_otp");
            await generateAndSendOTP(user.id, user.email!);
            finalNext = `/auth/verify-otp?uid=${user.id}&email=${encodeURIComponent(user.email!)}&next=${encodeURIComponent(finalNext)}`;
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
