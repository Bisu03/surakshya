import { withoutHiddenRoutes } from "@/lib/features";

// utils/tablinks.ts
const ALL_TAB_LINKS = [
  {
    category: "IPD",
    routes: [
      {
        name: "IPD Admission",
        path: "/ipd/admit",
      },
      {
        name: "IPD Record",
        path: "/ipd/record",
      },
      {
        name: "MRD",
        path: "/ipd/mrd/record",
      },
      {
        name: "IPD Advance",
        path: "/ipd/advance",
      },
      {
        name: "IPD Service & Billing",
        path: "/ipd/ipdservice",
      },
      {
        name: "Billing Record",
        path: "/ipd/billrecord",
      },
      {
        name: "Discharge",
        path: "/discharge/create",
      },
      {
        name: "Discharge Record",
        path: "/discharge/record",
      },
      {
        name: "Money Receipt",
        path: "/moneyreceipt/addnew",
      },
      {
        name: " Receipt Record",
        path: "/moneyreceipt/record",
      },
    ],
  },
  {
    category: "OPD",
    routes: [
      {
        name: "OPD Admission",
        path: "/opd/admit",
      },
      {
        name: "OPD Record",
        path: "/opd/record",
      },
    ],
  },
  {
    category: "Labtest",
    routes: [
      {
        name: "Labtest Test",
        path: "/labtest/create",
      },
      {
        name: "Labtest Record",
        path: "/labtest/record",
      },
      {
        name: "Pathology Reading",
        path: "/labtest/reading",
      },
    ],
  },
  {
    category: "Consultant Fee",
    routes: [
      {
        name: "Add New",
        path: "/consultantfee/addnew",
      },
      {
        name: "Record",
        path: "/consultantfee/record",
      },
    ],
  },
  {
    category: "Pathology",
    routes: [
      {
        name: "Category Record",
        path: "/admin/pathology/category",
      },
    ],
  },
  {
    category: "Inventory",
    routes: [
      {
        name: "Medicine Catalog",
        path: "/admin/medicine",
      },
      {
        name: "Medicine Category",
        path: "/admin/medicine/category",
      },
      {
        name: "Stock In",
        path: "/inventory/stockin",
      },
      {
        name: "Stock Out",
        path: "/inventory/stockout",
      },
      {
        name: "Stock Record",
        path: "/inventory/record",
      },
    ],
  },
  {
    category: "Setting",
    routes: [
      {
        name: "User Permission",
        path: "/admin/settings/users",
      },
      {
        name: "Doctor",
        path: "/doctor",
      },
      // {
      //   name: "Department",
      //   path: "/admin/settings/department",
      // },
      // {
      //   name: "Modules",
      //   path: "/admin/settings/module",
      // },
    ],
  },
  {
    category: "Services",
    routes: [
      {
        name: "Service List",
        path: "/admin/services",
      },
    ],
  },
  {
    category: "Billing",
    routes: [
      {
        name: "Billing",
        path: "/billing/makebills",
      },
      {
        name: "Bill Record",
        path: "/billing/record",
      },
    ],
  },
  {
    category: "Reports",
    routes: [
      {
        name: "Daily Report",
        path: "/admin/reports/daily",
      },
      {
        name: "Monthly Report",
        path: "/admin/reports/monthly",
      },
      {
        name: "Yearly Report",
        path: "/admin/reports/yearly",
      },
    ],
  },
  // Add more categories and routes as needed
];

// Hidden modules (see lib/features.js) are dropped from the menu.
export const TabLinks = withoutHiddenRoutes(ALL_TAB_LINKS);
