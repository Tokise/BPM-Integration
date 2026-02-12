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
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
  FileStack,
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
        "hr",
        "logistics",
        "finance",
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
          icon: LayoutDashboard,
          roles: ["seller"],
        },
        {
          title: "Dashboard",
          url: "/hr",
          icon: LayoutDashboard,
          roles: ["hr"],
        },
        {
          title: "Dashboard",
          url: "/logistic",
          icon: LayoutDashboard,
          roles: ["logistics"],
        },
        {
          title: "Dashboard",
          url: "/finance",
          icon: LayoutDashboard,
          roles: ["finance"],
        },
      ],
    },
    {
      title: "HUMAN RESOURCE 1",
      roles: ["admin", "hr"],
      items: [
        {
          title: "Applicant Management",
          url: "/hr/dept1/applicants",
          icon: UserPlus,
          roles: ["admin", "hr"],
        },
        {
          title: "Recruitment Management",
          url: "/hr/dept1/recruitment",
          icon: FileSearch,
          roles: ["admin", "hr"],
        },
        {
          title: "New Hire Onboarding",
          url: "/hr/dept1/onboarding",
          icon: UserCheck,
          roles: ["admin", "hr"],
        },
        {
          title: "Performance Management",
          url: "/hr/dept1/performance",
          icon: BarChart,
          roles: ["admin", "hr"],
        },
        {
          title: "Social Recognition",
          url: "/hr/dept1/recognition",
          icon: Award,
          roles: ["admin", "hr"],
        },
      ],
    },
    {
      title: "HUMAN RESOURCE 2",
      roles: ["admin", "hr"],
      items: [
        {
          title: "Competency Management",
          url: "/hr/dept2/competency",
          icon: Brain,
          roles: ["admin", "hr"],
        },
        {
          title: "Learning Management",
          url: "/hr/dept2/learning",
          icon: GraduationCap,
          roles: ["admin", "hr"],
        },
        {
          title: "Training Management",
          url: "/hr/dept2/training",
          icon: School,
          roles: ["admin", "hr"],
        },
        {
          title: "Succession Planning",
          url: "/hr/dept2/succession",
          icon: TrendingUp,
          roles: ["admin", "hr"],
        },
        {
          title: "Employee Self-Service",
          url: "/hr/dept2/ess",
          icon: UserCircle,
          roles: ["admin", "hr"],
        },
      ],
    },
    {
      title: "HUMAN RESOURCE 3",
      roles: ["admin", "hr"],
      items: [
        {
          title: "Time and Attendance",
          url: "/hr/dept3/attendance",
          icon: Clock,
          roles: ["admin", "hr"],
        },
        {
          title: "Shift and Schedule",
          url: "/hr/dept3/shifts",
          icon: Calendar,
          roles: ["admin", "hr"],
        },
        {
          title: "Timesheet Management",
          url: "/hr/dept3/timesheets",
          icon: ClipboardList,
          roles: ["admin", "hr"],
        },
        {
          title: "Leave Management",
          url: "/hr/dept3/leave",
          icon: Plane,
          roles: ["admin", "hr"],
        },
        {
          title: "Claims & Reimbursement",
          url: "/hr/dept3/claims",
          icon: Receipt,
          roles: ["admin", "hr"],
        },
      ],
    },
    {
      title: "HUMAN RESOURCE 4",
      roles: ["admin", "hr"],
      items: [
        {
          title: "Core HCM",
          url: "/hr/dept4/hcm",
          icon: Database,
          roles: ["admin", "hr"],
        },
        {
          title: "Payroll Management",
          url: "/hr/dept4/payroll",
          icon: Wallet,
          roles: ["admin", "hr"],
        },
        {
          title: "Compensation Planning",
          url: "/hr/dept4/compensation",
          icon: PieChart,
          roles: ["admin", "hr"],
        },
        {
          title: "HR Analytics Dashboard",
          url: "/hr/dept4/analytics",
          icon: LineChart,
          roles: ["admin", "hr"],
        },
        {
          title: "HMO & Benefits",
          url: "/hr/dept4/benefits",
          icon: HeartPulse,
          roles: ["admin", "hr"],
        },
      ],
    },
    {
      title: "CORE TRANSACTION 1",
      roles: ["admin", "customer", "seller"],
      items: [
        {
          title: "Storefront Viewer",
          url: "/core/transaction1/store",
          icon: Store,
          roles: ["admin", "customer"],
        },
        {
          title: "Storefront Preview",
          url: "/core/transaction2/seller/storefront",
          icon: Eye,
          roles: ["seller"],
        },
        {
          title: "Checkout & Placement",
          url: "/core/transaction1/checkout",
          icon: ShoppingCart,
          roles: ["admin", "customer"],
        },
        {
          title: "Location & Address",
          url: "/core/transaction1/profile/addresses",
          icon: MapPin,
          roles: ["admin", "customer"],
        },
        {
          title: "Order Tracking",
          url: "/core/transaction1/orders/tracking",
          icon: PackageSearch,
          roles: ["admin", "customer"],
        },
        {
          title: "Customer Support",
          url: "/core/transaction1/support",
          icon: Headset,
          roles: ["admin", "customer"],
        },
      ],
    },
    {
      title: "CORE TRANSACTION 2",
      roles: ["admin", "seller"],
      items: [
        {
          title: "Shop Management",
          url: "/core/transaction2/seller/shop",
          icon: ShoppingBag,
          roles: ["admin", "seller"],
        },
        {
          title: "Product Management",
          url: "/core/transaction2/seller/products",
          icon: Package,
          roles: ["seller"],
        },
        {
          title: "Order Fulfillment",
          url: "/core/transaction2/seller/orders",
          icon: ClipboardCheck,
          roles: ["admin", "seller"],
        },
        {
          title: "Returns Workflow",
          url: "/core/transaction2/seller/returns",
          icon: RotateCcw,
          roles: ["admin", "seller"],
        },
        {
          title: "Shipping Integration",
          url: "/core/transaction2/seller/shipping",
          icon: Truck,
          roles: ["admin", "seller"],
        },
        {
          title: "Earnings Dashboard",
          url: "/core/transaction2/seller/earnings",
          icon: DollarSign,
          roles: ["admin", "seller"],
        },
      ],
    },
    {
      title: "CORE TRANSACTION 3",
      roles: ["admin"],
      items: [
        {
          title: "Product Catalog",
          url: "/core/transaction3/admin/catalog",
          icon: Package,
          roles: ["admin"],
        },
        {
          title: "Subscriptions",
          url: "/core/transaction3/admin/subscriptions",
          icon: CreditCard,
          roles: ["admin"],
        },
        {
          title: "Catalogue Policy",
          url: "/core/transaction3/admin/policies",
          icon: Shield,
          roles: ["admin"],
        },
        {
          title: "Logistics Config",
          url: "/core/transaction3/admin/logistics-config",
          icon: Settings2,
          roles: ["admin"],
        },
        {
          title: "Payout Management",
          url: "/core/transaction3/admin/payouts",
          icon: Landmark,
          roles: ["admin"],
        },
        {
          title: "Reports & Admin",
          url: "/core/transaction3/admin/reports",
          icon: LayoutDashboard,
          roles: ["admin"],
        },
      ],
    },
    {
      title: "LOGISTICS 1",
      roles: ["admin", "logistics"],
      items: [
        {
          title: "Warehouse Management",
          url: "/logistic/dept1/warehouse",
          icon: Warehouse,
          roles: ["admin", "logistics"],
        },
        {
          title: "Procurement Management",
          url: "/logistic/dept1/procurement-management",
          icon: Truck,
          roles: ["admin", "logistics"],
        },
        {
          title: "Project Logistic Tracking",
          url: "/logistic/dept1/project-logistic-tracking",
          icon: Users,
          roles: ["admin", "logistics"],
        },
        {
          title: "Asset Lifecycle",
          url: "/logistic/dept1/alms",
          icon: Wrench,
          roles: ["admin", "logistics"],
        },
        {
          title: "Document Tracking",
          url: "/logistic/dept1/dtrs",
          icon: FileText,
          roles: ["admin", "logistics"],
        },
      ],
    },
    {
      title: "LOGISTICS 2",
      roles: ["admin", "logistics"],
      items: [
        {
          title: "Fleet Management",
          url: "/logistic/dept2/fleet",
          icon: Car,
          roles: ["admin", "logistics"],
        },
        {
          title: "Vehicle Reservation",
          url: "/logistic/dept2/vrds",
          icon: Bookmark,
          roles: ["admin", "logistics"],
        },
        {
          title: "Driver Monitoring",
          url: "/logistic/dept2/personnel",
          icon: Eye,
          roles: ["admin", "logistics"],
        },
        {
          title: "Cost Analysis",
          url: "/logistic/dept2/tcao",
          icon: Calculator,
          roles: ["admin", "logistics"],
        },
        {
          title: "Fleet Command App",
          url: "/logistic/dept2/app",
          icon: Smartphone,
          roles: ["admin", "logistics"],
        },
        {
          title: "Disbursement",
          url: "/logistic/dept2/disbursement",
          icon: Banknote,
          roles: ["admin", "logistics"],
        },
      ],
    },
    {
      title: "FINANCIALS",
      roles: ["admin", "finance"],
      items: [
        {
          title: "Budget Management",
          url: "/finance/budget",
          icon: PiggyBank,
          roles: ["admin", "finance"],
        },
        {
          title: "Collection",
          url: "/finance/collection",
          icon: Coins,
          roles: ["admin", "finance"],
        },
        {
          title: "General Ledger",
          url: "/finance/ledger",
          icon: Book,
          roles: ["admin", "finance"],
        },
        {
          title: "AP / AR",
          url: "/finance/ap-ar",
          icon: FileStack,
          roles: ["admin", "finance"],
        },
      ],
    },
  ],
};

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user, profile } = useUser();
  const { isMobile, state, open, setOpen } =
    useSidebar();

  const userRole = profile?.role || "Guest";

  return (
    <>
      {/* External Plain Toggle Button */}
      <div
        className={cn(
          "fixed top-[5.5rem] z-[120] transition-all duration-300",
          open
            ? "left-[calc(var(--sidebar-width)+1rem)]"
            : "left-[calc(var(--sidebar-width-icon)+1rem)]",
        )}
      >
        <SidebarTrigger className="h-5 w-1 text-amber-600 hover:text-amber-700 transition-all flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer z-10" />
      </div>

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
                className="hover:bg-transparent cursor-default"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-amber-500 text-white shrink-0">
                  <Sparkles className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-black text-slate-900 uppercase tracking-tighter">
                    BPM Integration
                  </span>
                  <span className="truncate text-[10px] font-bold text-amber-600 uppercase">
                    {userRole}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {data.navMain.map((group) => {
            const hasGroupAccess =
              (profile?.role &&
                group.roles.includes(
                  profile.role,
                )) ||
              (user?.role &&
                group.roles.includes(user.role));

            if (!hasGroupAccess) return null;

            return (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel className="text-amber-600/90 font-black tracking-widest text-[9px] uppercase px-4 mb-2">
                  {group.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const hasItemAccess =
                        item.roles.includes(
                          profile?.role ||
                            "customer",
                        ) ||
                        (user?.role &&
                          item.roles.includes(
                            user.role,
                          ));

                      if (!hasItemAccess)
                        return null;

                      const isActive =
                        pathname === item.url;

                      return (
                        <SidebarMenuItem
                          key={item.title}
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                            className={cn(
                              "transition-all duration-300 font-bold h-10 px-4",
                              isActive
                                ? "bg-amber-50 text-slate-900 border-l-4 border-amber-500 rounded-none shadow-none translate-x-1"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                            )}
                          >
                            <Link
                              href={item.url}
                              className="flex items-center gap-3"
                            >
                              <item.icon
                                className={cn(
                                  "size-4 shrink-0",
                                  isActive
                                    ? "text-amber-500"
                                    : "text-slate-400",
                                )}
                              />
                              <span className="truncate">
                                {item.title}
                              </span>
                            </Link>
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
