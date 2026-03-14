"use client";
import EmployeePerformancePage from "@/app/hr/dept1/performance/page";
import { useUser } from "@/context/UserContext";

export default function LogisticPerformancePage() {
  const { profile } = useUser();

  // Robust checking for department code
  const deptObj = Array.isArray(
    profile?.department,
  )
    ? profile?.department[0]
    : profile?.department;
  const deptCode = deptObj?.code;

  let backUrl = "/logistic"; // default Fallback

  if (deptCode === "LOG_DEPT1") {
    backUrl = "/logistic/dept1";
  } else if (deptCode === "LOG_DEPT2") {
    backUrl = "/logistic/dept2";
  }

  return (
    <EmployeePerformancePage
      backUrl={backUrl}
      title="Logistics Performance"
    />
  );
}
