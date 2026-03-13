"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
  SidebarTrigger,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  Truck,
  Warehouse,
  Users,
  CreditCard,
  Settings,
  Package,
  ShieldCheck,
  BarChart3,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  User,
  BadgeCheck,
  Bell,
  Sparkles,
  UserPlus,
  FileSearch,
  UserCheck,
  BarChart,
  Award,
  Brain,
  GraduationCap,
  School,
  TrendingUp,
  UserCircle,
  Clock,
  Calendar,
  ClipboardList,
  Plane,
  Receipt,
  Database,
  Wallet,
  PieChart,
  LineChart,
  HeartPulse,
  Store,
  ShoppingCart,
  MapPin,
  PackageSearch,
  Headset,
  ShoppingBag,
  ClipboardCheck,
  RotateCcw,
  DollarSign,
  Shield,
  Settings2,
  Landmark,
  ShoppingBasket,
  Map,
  Wrench,
  FileText,
  Car,
  Bookmark,
  Eye,
  Calculator,
  Smartphone,
  Banknote,
  PiggyBank,
  Coins,
  Book,
  BookOpen,
  FileStack,
  Globe,
  Layout,
} from "lucide-react";

import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

const data = {
  navMain: [
    {
      title: "MAIN",
      roles: [
        "admin",
        "seller",
        "hr1_admin",
        "hr1_employee",
        "hr2_admin",
        "hr2_employee",
        "hr3_admin",
        "hr3_employee",
        "hr4_admin",
        "hr4_employee",
        "finance_admin",
        "finance_employee",
        "logistic1_admin",
        "logistic1_employee",
        "logistic2_admin",
        "logistic2_employee",
        "logistic2_driver",
      ],
      items: [
        {
          title: "Dashboard",
          url: "/core/transaction3/admin",
          icon: LayoutDashboard,
          roles: ["admin"],
        },
        {
          title: "Dashboard",
          url: "/core/transaction2/seller",
          fbsUrl: "/core/transaction2/fbs",
          icon: LayoutDashboard,
          roles: ["seller"],
        },
        {
          title: "Dashboard",
          url: "/hr",
          icon: LayoutDashboard,
          roles: [
            "hr1_admin",
            "hr1_employee",
            "hr2_admin",
            "hr2_employee",
            "hr3_admin",
            "hr3_employee",
            "hr4_admin",
            "hr4_employee",
          ],
        },
        {
          title: "Dashboard",
          url: "/logistic",
          icon: LayoutDashboard,
          roles: [
            "logistic1_admin",
            "logistic1_employee",
            "logistic2_admin",
            "logistic2_employee",
          ],
        },
        {
          title: "Dashboard",
          url: "/logistic/dept2/driver",
          icon: LayoutDashboard,
          roles: ["logistic2_driver"],
        },
        {
          title: "Dashboard",
          url: "/finance",
          icon: LayoutDashboard,
          roles: [
            "finance_admin",
            "finance_employee",
          ],
        },
      ],
    },
    {
      title: "CORE TRANSACTION 1",
      roles: ["seller"],
      items: [
        {
          title: "Storefront Preview",
          url: "/core/transaction2/seller/storefront",
          fbsUrl:
            "/core/transaction2/fbs/storefront",
          icon: Globe,
          roles: ["seller"],
        },
      ],
    },
    {
      title: "CORE TRANSACTION 3",
      roles: ["admin"],
      items: [
        {
          title: "Platform Admin",
          icon: ShieldCheck,
          roles: ["admin"],
          subItems: [
            {
              title: "Org Governance",
              url: "/core/transaction3/admin/hcm",
              roles: ["admin"],
            },
            {
              title: "System Audit",
              url: "/core/transaction3/admin/audit",
              roles: ["admin"],
            },
            {
              title: "Platform Catalog",
              url: "/core/transaction3/admin/catalog",
              roles: ["admin"],
            },
            {
              title: "Payout Management",
              url: "/core/transaction3/admin/payouts",
              roles: ["admin"],
            },
            {
              title: "Performance",
              url: "/core/transaction3/admin/performance",
              roles: ["admin"],
            },
            {
              title: "Policies",
              url: "/core/transaction3/admin/policies",
              roles: ["admin"],
            },
            {
              title: "Subscription Plans",
              url: "/core/transaction3/admin/subscriptions",
              roles: ["admin"],
            },
            {
              title: "Logistics Config",
              url: "/core/transaction3/admin/logistics-config",
              roles: ["admin"],
            },
            {
              title: "Reports",
              url: "/core/transaction3/admin/reports",
              roles: ["admin"],
            },
          ],
        },
      ],
    },
    {
      title: "CORE TRANSACTION 2",
      roles: ["admin"],
      items: [
        {
          title: "Seller Center",
          icon: Store,
          roles: ["admin"],
          subItems: [
            {
              title: "Sellers List",
              url: "/core/transaction3/admin/sellers",
              roles: ["admin"],
            },
          ],
        },
      ],
    },
    {
      title: "CORE TRANSACTION 2",
      roles: ["seller"],
      items: [
        {
          title: "Order Management",
          url: "/core/transaction2/seller/orders",
          fbsUrl: "/core/transaction2/fbs/orders",
          roles: ["seller"],
          icon: ShoppingBag,
        },
        {
          title: "Product Management",
          url: "/core/transaction2/seller/products",
          fbsUrl:
            "/core/transaction2/fbs/products",
          roles: ["seller"],
          icon: Package,
        },
        {
          title: "Shop Management",
          url: "/core/transaction2/seller/shop",
          fbsUrl: "/core/transaction2/fbs/shop",
          roles: ["seller"],
          icon: Store,
        },
        {
          title: "Earnings",
          url: "/core/transaction2/seller/earnings",
          fbsUrl:
            "/core/transaction2/fbs/earnings",
          roles: ["seller"],
          icon: BarChart,
        },
        {
          title: "Returns & Refunds",
          url: "/core/transaction2/seller/returns",
          fbsUrl:
            "/core/transaction2/fbs/returns",
          roles: ["seller"],
          icon: Package,
        },
        {
          title: "Shipping Settings",
          url: "/core/transaction2/seller/shipping",
          fbsUrl:
            "/core/transaction2/fbs/shipping",
          roles: ["seller"],
          icon: Package,
        },
      ],
    },
    {
      title: "HUMAN RESOURCE 1",
      roles: [
        "hr1_admin",
        "hr1_employee",
        "hr2_admin",
        "hr2_employee",
        "hr3_admin",
        "hr3_employee",
        "hr4_admin",
        "hr4_employee",
        "logistic1_admin",
        "logistic1_employee",
        "logistic2_admin",
        "logistic2_employee",
        "logistic2_driver",
        "finance_admin",
        "finance_employee",
        "admin",
      ],
      deptCode: "HR_DEPT1",
      items: [
        {
          title: "Acquisitions",
          icon: UserPlus,
          roles: [
            "hr1_admin",
            "hr1_employee",
            "admin",
          ],
          subItems: [
            {
              title: "Applicant Management",
              url: "/hr/dept1/applicants",
              roles: [
                "hr1_admin",
                "hr1_employee",
                "admin",
              ],
            },
            {
              title: "Recruitment Management",
              url: "/hr/dept1/recruitment",
              roles: ["hr1_admin", "admin"],
            },
            {
              title: "New Hire Onboarding",
              url: "/hr/dept1/onboarding",
              roles: [
                "hr1_admin",
                "hr1_employee",
                "admin",
              ],
            },
          ],
        },
        {
          title: "Performance",
          icon: BarChart,
          roles: [
            "hr1_admin",
            "hr1_employee",
            "hr2_admin",
            "hr2_employee",
            "hr3_admin",
            "hr3_employee",
            "hr4_admin",
            "hr4_employee",
            "logistic1_admin",
            "logistic1_employee",
            "logistic2_admin",
            "logistic2_employee",
            "logistic2_driver",
            "finance_admin",
            "finance_employee",
            "admin",
          ],
          subItems: [
            {
              title: "Performance Management",
              url: "/hr/dept1/performance",
              roles: [
                "hr1_admin",
                "hr1_employee",
                "hr2_admin",
                "hr2_employee",
                "hr3_admin",
                "hr3_employee",
                "hr4_admin",
                "hr4_employee",
                "logistic1_admin",
                "logistic1_employee",
                "logistic2_admin",
                "logistic2_employee",
                "logistic2_driver",
                "finance_admin",
                "finance_employee",
                "admin",
              ],
            },
            {
              title: "Social Recognition",
              url: "/hr/dept1/recognition",
              roles: [
                "hr1_admin",
                "hr1_employee",
                "hr2_admin",
                "hr2_employee",
                "hr3_admin",
                "hr3_employee",
                "hr4_admin",
                "hr4_employee",
                "logistic1_admin",
                "logistic1_employee",
                "logistic2_admin",
                "logistic2_employee",
                "logistic2_driver",
                "finance_admin",
                "finance_employee",
                "admin",
              ],
            },
          ],
        },
      ],
    },
    {
      title: "HUMAN RESOURCE 2",
      roles: [
        "hr2_admin",
        "hr2_employee",
        "hr1_admin",
        "hr1_employee",
        "hr3_admin",
        "hr3_employee",
        "hr4_admin",
        "hr4_employee",
        "logistic1_admin",
        "logistic1_employee",
        "logistic2_admin",
        "logistic2_employee",
        "logistic2_driver",
        "finance_admin",
        "finance_employee",
        "admin",
      ],
      deptCode: "HR_DEPT2",
      items: [
        {
          title: "Talent Development",
          icon: Brain,
          roles: [
            "hr2_admin",
            "hr2_employee",
            "hr1_admin",
            "hr1_employee",
            "hr3_admin",
            "hr3_employee",
            "hr4_admin",
            "hr4_employee",
            "logistic1_admin",
            "logistic1_employee",
            "logistic2_admin",
            "logistic2_employee",
            "logistic2_driver",
            "finance_admin",
            "finance_employee",
            "admin",
          ],
          subItems: [
            {
              title: "Competency Management",
              url: "/hr/dept2/competency",
              roles: ["hr2_admin", "admin"],
            },
            {
              title: "Learning Management",
              url: "/hr/dept2/learning",
              roles: [
                "hr2_admin",
                "hr2_employee",
                "hr1_admin",
                "hr1_employee",
                "hr3_admin",
                "hr3_employee",
                "hr4_admin",
                "hr4_employee",
                "logistic1_admin",
                "logistic1_employee",
                "logistic2_admin",
                "logistic2_employee",
                "logistic2_driver",
                "finance_admin",
                "finance_employee",
                "admin",
              ],
            },
            {
              title: "Training Management",
              url: "/hr/dept2/training",
              roles: [
                "hr2_admin",
                "hr2_employee",
                "hr1_admin",
                "hr1_employee",
                "hr3_admin",
                "hr3_employee",
                "hr4_admin",
                "hr4_employee",
                "logistic1_admin",
                "logistic1_employee",
                "logistic2_admin",
                "logistic2_employee",
                "logistic2_driver",
                "finance_admin",
                "finance_employee",
                "admin",
              ],
            },
            {
              title: "Succession Planning",
              url: "/hr/dept2/succession",
              roles: ["hr2_admin", "admin"],
            },
          ],
        },
      ],
    },
    {
      title: "HUMAN RESOURCE 3",
      roles: [
        "hr3_admin",
        "hr3_employee",
        "hr1_admin",
        "hr1_employee",
        "hr2_admin",
        "hr2_employee",
        "hr4_admin",
        "hr4_employee",
        "logistic1_admin",
        "logistic1_employee",
        "logistic2_admin",
        "logistic2_employee",
        "logistic2_driver",
        "finance_admin",
        "finance_employee",
        "admin",
      ],
      deptCode: "HR_DEPT3",
      items: [
        {
          title: "Time & Attendance",
          icon: Clock,
          roles: [
            "hr3_admin",
            "hr3_employee",
            "hr1_admin",
            "hr1_employee",
            "hr2_admin",
            "hr2_employee",
            "hr4_admin",
            "hr4_employee",
            "logistic1_admin",
            "logistic1_employee",
            "logistic2_admin",
            "logistic2_employee",
            "logistic2_driver",
            "finance_admin",
            "finance_employee",
            "admin",
          ],
          subItems: [
            {
              title: "Attendance Tracking",
              url: "/hr/dept3/attendance",
              roles: [
                "hr3_admin",
                "hr3_employee",
                "admin",
              ],
            },
            {
              title: "Shift Scheduler",
              url: "/hr/dept3/shifts",
              roles: [
                "hr3_admin",
                "hr3_employee",
                "hr1_admin",
                "hr1_employee",
                "hr2_admin",
                "hr2_employee",
                "hr4_admin",
                "hr4_employee",
                "logistic1_admin",
                "logistic1_employee",
                "logistic2_admin",
                "logistic2_employee",
                "logistic2_driver",
                "finance_admin",
                "finance_employee",
                "admin",
              ],
            },
            {
              title: "Timesheet Management",
              url: "/hr/dept3/timesheets",
              roles: [
                "hr3_admin",
                "hr3_employee",
                "admin",
              ],
            },
          ],
        },
        {
          title: "Self Service",
          icon: Plane,
          roles: [
            "hr3_admin",
            "hr3_employee",
            "hr1_admin",
            "hr1_employee",
            "hr2_admin",
            "hr2_employee",
            "hr4_admin",
            "hr4_employee",
            "logistic1_admin",
            "logistic1_employee",
            "logistic2_admin",
            "logistic2_employee",
            "logistic2_driver",
            "finance_admin",
            "finance_employee",
            "admin",
          ],
          subItems: [
            {
              title: "Leave Management",
              url: "/hr/dept3/leave",
              roles: [
                "hr3_admin",
                "hr3_employee",
                "hr1_admin",
                "hr1_employee",
                "hr2_admin",
                "hr2_employee",
                "hr4_admin",
                "hr4_employee",
                "logistic1_admin",
                "logistic1_employee",
                "logistic2_admin",
                "logistic2_employee",
                "logistic2_driver",
                "finance_admin",
                "finance_employee",
                "admin",
              ],
            },
            {
              title: "Claims & Reimbursement",
              url: "/hr/dept3/claims",
              roles: [
                "hr3_admin",
                "hr3_employee",
                "hr1_admin",
                "hr1_employee",
                "hr2_admin",
                "hr2_employee",
                "hr4_admin",
                "hr4_employee",
                "logistic1_admin",
                "logistic1_employee",
                "logistic2_admin",
                "logistic2_employee",
                "logistic2_driver",
                "finance_admin",
                "finance_employee",
                "admin",
              ],
            },
          ],
        },
      ],
    },
    {
      title: "HUMAN RESOURCE 4",
      roles: [
        "hr4_admin",
        "hr4_employee",
        "hr1_admin",
        "hr1_employee",
        "hr2_admin",
        "hr2_employee",
        "hr3_admin",
        "hr3_employee",
        "logistic1_admin",
        "logistic1_employee",
        "logistic2_admin",
        "logistic2_employee",
        "logistic2_driver",
        "finance_admin",
        "finance_employee",
        "admin",
      ],
      deptCode: "HR_DEPT4",
      items: [
        {
          title: "Payroll & Benefits",
          icon: Wallet,
          roles: [
            "hr4_admin",
            "hr4_employee",
            "hr1_admin",
            "hr1_employee",
            "hr2_admin",
            "hr2_employee",
            "hr3_admin",
            "hr3_employee",
            "logistic1_admin",
            "logistic1_employee",
            "logistic2_admin",
            "logistic2_employee",
            "logistic2_driver",
            "finance_admin",
            "finance_employee",
            "admin",
          ],
          subItems: [
            {
              title: "Core HCM",
              url: "/hr/dept4/hcm",
              roles: [
                "hr4_admin",
                "hr4_employee",
                "admin",
              ],
            },
            {
              title: "Payroll Management",
              url: "/hr/dept4/payroll",
              roles: [
                "hr4_admin",
                "hr4_employee",
                "hr1_admin",
                "hr1_employee",
                "hr2_admin",
                "hr2_employee",
                "hr3_admin",
                "hr3_employee",
                "logistic1_admin",
                "logistic1_employee",
                "logistic2_admin",
                "logistic2_employee",
                "logistic2_driver",
                "finance_admin",
                "finance_employee",
                "admin",
              ],
            },
            {
              title: "Compensation Planning",
              url: "/hr/dept4/compensation",
              roles: [
                "hr4_admin",
                "hr4_employee",
                "admin",
              ],
            },
            {
              title: "HMO & Benefits",
              url: "/hr/dept4/benefits",
              roles: [
                "hr4_admin",
                "hr4_employee",
                "hr1_admin",
                "hr1_employee",
                "hr2_admin",
                "hr2_employee",
                "hr3_admin",
                "hr3_employee",
                "logistic1_admin",
                "logistic1_employee",
                "logistic2_admin",
                "logistic2_employee",
                "logistic2_driver",
                "finance_admin",
                "finance_employee",
                "admin",
              ],
            },
            {
              title: "HR Analytics",
              url: "/hr/dept4/analytics",
              roles: ["hr4_admin", "admin"],
            },
          ],
        },
      ],
    },
    {
      title: "LOGISTICS 1",
      roles: [
        "logistic1_admin",
        "logistic1_employee",
        "admin",
      ],
      deptCode: "LOG_DEPT1",
      items: [
        {
          title: "Warehouse Opt",
          icon: Warehouse,
          roles: [
            "logistic1_admin",
            "logistic1_employee",
            "admin",
          ],
          subItems: [
            {
              title: "Warehouse",
              url: "/logistic/dept1/warehouse",
              roles: [
                "logistic1_admin",
                "logistic1_employee",
                "admin",
              ],
            },
            {
              title: "Procurement Management",
              url: "/logistic/dept1/procurement-management",
              roles: ["logistic1_admin", "admin"],
            },
            {
              title: "Asset Lifecycle",
              url: "/logistic/dept1/alms",
              roles: ["logistic1_admin", "admin"],
            },
          ],
        },
        {
          title: "Operations",
          icon: Truck,
          roles: [
            "logistic1_admin",
            "logistic1_employee",
            "admin",
          ],
          subItems: [
            {
              title: "Logistic Tracking",
              url: "/logistic/dept1/project-logistic-tracking",
              roles: [
                "logistic1_admin",
                "logistic1_employee",
                "admin",
              ],
            },
            {
              title: "Document Tracking",
              url: "/logistic/dept1/dtrs",
              roles: [
                "logistic1_admin",
                "logistic1_employee",
                "admin",
              ],
            },
          ],
        },
      ],
    },
    {
      title: "LOGISTICS 2",
      roles: [
        "logistic2_admin",
        "logistic2_employee",
        "logistic2_driver",
        "admin",
      ],
      deptCode: "LOG_DEPT2",
      items: [
        {
          title: "Fleet & Driver",
          icon: Car,
          roles: [
            "logistic2_admin",
            "logistic2_employee",
            "logistic2_driver",
            "admin",
          ],
          subItems: [
            {
              title: "Fleet Management",
              url: "/logistic/dept2/fleet",
              roles: [
                "logistic2_admin",
                "logistic2_employee",
                "admin",
              ],
            },
            {
              title: "Vehicle Reservation",
              url: "/logistic/dept2/vrds",
              roles: [
                "logistic2_admin",
                "logistic2_employee",
                "admin",
              ],
            },
            {
              title: "Driver Monitoring",
              url: "/logistic/dept2/personnel",
              roles: [
                "logistic2_admin",
                "logistic2_employee",
                "admin",
              ],
            },
            {
              title: "Cost Analysis",
              url: "/logistic/dept2/tcao",
              roles: ["logistic2_admin", "admin"],
            },
            {
              title: "My Fleet",
              url: "/logistic/dept2/driver/fleet",
              roles: ["logistic2_driver"],
            },
            {
              title: "My Vehicle",
              url: "/logistic/dept2/driver/vehicle",
              roles: ["logistic2_driver"],
            },
          ],
        },
      ],
    },
    {
      title: "FINANCIALS",
      roles: [
        "finance_admin",
        "finance_employee",
        "admin",
      ],
      deptCode: "FINANCE",
      items: [
        {
          title: "Accounting",
          icon: FileText,
          roles: [
            "finance_admin",
            "finance_employee",
            "admin",
          ],
          subItems: [
            {
              title: "Budget Management",
              url: "/finance/budget",
              roles: ["finance_admin", "admin"],
            },
            {
              title: "Disbursement",
              url: "/finance/collection",
              roles: [
                "finance_admin",
                "finance_employee",
                "admin",
              ],
            },
            {
              title: "General Ledger",
              url: "/finance/ledger",
              roles: ["finance_admin", "admin"],
            },
            {
              title: "AP / AR",
              url: "/finance/ap-ar",
              roles: [
                "finance_admin",
                "finance_employee",
                "admin",
              ],
            },
          ],
        },
      ],
    },
  ],
};

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const {
    user,
    profile,
    shop: userShop,
  } = useUser();
  const isWarehouseSeller =
    userShop?.fulfillment_type === "warehouse";
  const { isMobile, state, open, setOpen } =
    useSidebar();

  const userRole = profile?.role || "Guest";

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="!fixed !top-20 !h-[calc(100vh-5rem)] border-r border-slate-200"
        {...props}
      >
        <SidebarHeader className="py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-transparent cursor-default"
              >
                <div>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-amber-500 text-white shrink-0">
                    <SidebarTrigger className="flex items-center justify-center hover:bg-transparent cursor-default hover:text-white" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-black text-slate-900 uppercase tracking-tighter">
                      BPM Integration
                    </span>
                    <span className="truncate text-[10px] font-bold text-amber-600 uppercase">
                      {userRole}
                    </span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {[...data.navMain]
            .sort((a, b) => {
              if (a.title === "MAIN") return -1;
              if (b.title === "MAIN") return 1;
              const userDeptCode =
                profile?.department?.code;
              if (a.deptCode === userDeptCode)
                return -1;
              if (b.deptCode === userDeptCode)
                return 1;
              return 0;
            })
            .map((group) => {
              const userRole = (
                profile?.role || "Guest"
              ).toLowerCase();
              const userDeptCode =
                profile?.department?.code;
              const isPrimaryDept =
                userDeptCode === group.deptCode;

              // Role Access Check (Group level)
              const hasRoleAccess =
                group.roles.includes(
                  userRole as any,
                );

              if (!hasRoleAccess) return null;

              return (
                <SidebarGroup key={group.title}>
                  <SidebarGroupLabel className="text-amber-600/90 font-black tracking-widest text-[9px] uppercase px-4 mb-2">
                    {group.title}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const hasRoleAccessForItem =
                          item.roles.includes(
                            userRole as any,
                          );

                        if (!hasRoleAccessForItem)
                          return null;

                        // Logic to disable navigation for non-primary dept submodules
                        const isIntegration =
                          group.deptCode &&
                          userDeptCode &&
                          group.deptCode !==
                            userDeptCode;

                        const subItems =
                          (item as any)
                            .subItems || [];
                        const hasSubItems =
                          subItems.length > 0;
                        const hasActiveSubItem =
                          subItems.some(
                            (sub: any) =>
                              pathname ===
                                sub.url ||
                              (sub.url !== "/" &&
                                pathname.startsWith(
                                  sub.url + "/",
                                )),
                          );

                        if (hasSubItems) {
                          const isPerformanceIntegrated =
                            item.title ===
                              "Performance" &&
                            group.title !==
                              "HUMAN RESOURCE 1";

                          return (
                            <div key={item.title}>
                              {isPerformanceIntegrated && (
                                <div className="px-4 py-2 mt-4 mb-1">
                                  <span className="text-amber-600/90 font-black tracking-widest text-[9px] uppercase">
                                    HUMAN RESOURCE
                                    1
                                  </span>
                                </div>
                              )}
                              <Collapsible
                                asChild
                                defaultOpen={
                                  hasActiveSubItem
                                }
                                className="group/collapsible"
                              >
                                <SidebarMenuItem>
                                  <CollapsibleTrigger
                                    asChild
                                  >
                                    <SidebarMenuButton
                                      tooltip={
                                        item.title
                                      }
                                      isActive={
                                        false
                                      }
                                      className={cn(
                                        "transition-all duration-300 font-bold h-10 px-4 flex items-center gap-3",
                                        "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                                        hasActiveSubItem &&
                                          "text-slate-900",
                                      )}
                                    >
                                      {item.icon && (
                                        <item.icon
                                          className={cn(
                                            "size-4 shrink-0",
                                            hasActiveSubItem
                                              ? "text-amber-600"
                                              : "text-slate-400",
                                          )}
                                        />
                                      )}
                                      <span>
                                        {
                                          item.title
                                        }
                                      </span>
                                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <SidebarMenuSub>
                                      {subItems.map(
                                        (
                                          subItem: any,
                                        ) => {
                                          const hasSubItemRole =
                                            subItem.roles.includes(
                                              userRole as any,
                                            );
                                          if (
                                            !hasSubItemRole
                                          )
                                            return null;

                                          // Integration check for sub-items
                                          const isSubIntegration =
                                            isIntegration;
                                          const subUrl =
                                            isSubIntegration
                                              ? "#"
                                              : subItem.url;
                                          const isSubActive =
                                            pathname ===
                                            subUrl;

                                          return (
                                            <SidebarMenuSubItem
                                              key={
                                                subItem.title
                                              }
                                            >
                                              <SidebarMenuSubButton
                                                asChild
                                                isActive={
                                                  pathname ===
                                                    subItem.url ||
                                                  (subItem.url !==
                                                    "/" &&
                                                    pathname.startsWith(
                                                      subItem.url +
                                                        "/",
                                                    ))
                                                }
                                                className={cn(
                                                  "transition-all duration-300 font-bold h-9 px-4 flex items-center gap-3 rounded-none mx-0 w-full",
                                                  pathname ===
                                                    subItem.url ||
                                                    (subItem.url !==
                                                      "/" &&
                                                      pathname.startsWith(
                                                        subItem.url +
                                                          "/",
                                                      ))
                                                    ? "bg-amber-50 text-slate-900 border-l-4 border-amber-500 shadow-none translate-x-0"
                                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                                                )}
                                              >
                                                {isSubIntegration ? (
                                                  <span className="flex items-center gap-3 cursor-default opacity-70">
                                                    <span>
                                                      {
                                                        subItem.title
                                                      }
                                                    </span>
                                                  </span>
                                                ) : (
                                                  <Link
                                                    href={
                                                      subUrl
                                                    }
                                                  >
                                                    <span>
                                                      {
                                                        subItem.title
                                                      }
                                                    </span>
                                                  </Link>
                                                )}
                                              </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                          );
                                        },
                                      )}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                </SidebarMenuItem>
                              </Collapsible>
                            </div>
                          );
                        }

                        // Single item logic
                        let resolvedUrl =
                          isWarehouseSeller &&
                          (item as any).fbsUrl
                            ? (item as any).fbsUrl
                            : (item as any).url;

                        if (
                          (resolvedUrl ===
                            "/hr" ||
                            resolvedUrl ===
                              "/logistic") &&
                          userDeptCode &&
                          userDeptCode.includes(
                            "_",
                          )
                        ) {
                          const dept =
                            userDeptCode
                              .split("_")[1]
                              .toLowerCase();
                          resolvedUrl = `${resolvedUrl}/${dept}`;
                        }

                        // Integration check for single items
                        const itemUrl =
                          isIntegration
                            ? "#"
                            : resolvedUrl;
                        const isActive =
                          item.title ===
                          "Dashboard"
                            ? pathname === itemUrl
                            : pathname ===
                                itemUrl ||
                              (itemUrl !== "/" &&
                                pathname.startsWith(
                                  itemUrl + "/",
                                ));

                        return (
                          <SidebarMenuItem
                            key={item.title}
                          >
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={cn(
                                "transition-all duration-300 font-bold h-10 px-4 flex items-center gap-3",
                                isActive
                                  ? "bg-amber-50 text-slate-900 border-l-4 border-amber-500 rounded-none shadow-none translate-x-1"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                                isIntegration &&
                                  "cursor-default",
                              )}
                            >
                              {isIntegration ? (
                                <div className="flex items-center gap-3 opacity-70">
                                  {item.icon && (
                                    <item.icon
                                      className={cn(
                                        "size-4 shrink-0",
                                        isActive
                                          ? "text-amber-500"
                                          : "text-slate-400",
                                      )}
                                    />
                                  )}
                                  <span className="truncate">
                                    {item.title}
                                  </span>
                                </div>
                              ) : (
                                <Link
                                  href={itemUrl}
                                  className="flex items-center gap-3"
                                >
                                  {item.icon && (
                                    <item.icon
                                      className={cn(
                                        "size-4 shrink-0",
                                        isActive
                                          ? "text-amber-500"
                                          : "text-slate-400",
                                      )}
                                    />
                                  )}
                                  <span className="truncate">
                                    {item.title}
                                  </span>
                                </Link>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
