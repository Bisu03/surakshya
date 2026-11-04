import { withoutHiddenRoutes } from "@/lib/features";
import { BiChart, BiMoneyWithdraw } from "react-icons/bi";
import { FaClinicMedical, FaFileMedical } from "react-icons/fa";
import { ImLab } from "react-icons/im";
import {
  MdAdminPanelSettings,
  MdBedroomParent,
  MdDashboard,
  MdGraphicEq,
  MdMedicalServices,
  MdMedication,
  MdPeople,
  MdRestore,
} from "react-icons/md";

const ALL_NAV_LINKS = [
  {
    icon: <MdDashboard />,
    category: "Dashboard",
    routes: [
      {
        name: "Summary",
        path: "/dashboard/menu",
      },
    ],
  },
  {
    icon: <MdPeople />,
    category: "Patient",
    routes: [
      {
        name: "Record",
        path: "/patient/record",
      },
    ],
  },
  {
    icon: <MdBedroomParent />,
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
    icon: < FaClinicMedical />,
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
    icon: < ImLab />,
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
        name: "Lab Reading",
        path: "/labtest/reading",
      },
    ],
  },
  {
    icon: < FaFileMedical />,
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
    icon: < MdMedication />,
    category: "Doctor Summary",
    routes: [
      {
        name: "OPD Summary",
        path: "/doctorsummary/opd",
      },
      {
        name: "LAB Summary",
        path: "/doctorsummary/lab",
      },
      {
        name: "Doctor List",
        path: "/doctor",
      },
    ],
  },

  {
    icon: <BiChart />,
    category: "Report",
    routes: [
      {
        name: "OPD Report",
        path: "/report/opd",
      },
      {
        name: "IPD Report",
        path: "/report/ipd",
      },
      {
        name: "LAB Report",
        path: "/report/lab",
      },
      {
        name: "Expense Report",
        path: "/report/expense",
      },

    ],
  },
  {
    icon: <BiMoneyWithdraw />,
    category: "Expense",
    routes: [
      {
        name: "Expense",
        path: "/expense/add",
      },
      {
        name: "Expense Category",
        path: "/expense/category",
      },
    ],
  },
  {
    icon: <MdMedicalServices />,
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
    icon: <MdAdminPanelSettings />,
    category: "Admin",
    routes: [
      {
        name: "Users & Permissions",
        path: "/admin/settings/users",
      },
      {
        name: "Service List",
        path: "/admin/services",
      },
      {
        name: "Pathology Price List",
        path: "/admin/pathology/category",
      },
      {
        name: "Radiology  Price List",
        path: "/admin/radiology/record",
      },
      {
        name: "Pathology Test",
        path: "/pathologytest/addtest",
      },
      {
        name: "Pathology Test List",
        path: "/pathologytest/record",
      },
    ],
  },
];

// Hidden modules (see lib/features.js) are dropped from the menu.
export const NavLinks = withoutHiddenRoutes(ALL_NAV_LINKS);
