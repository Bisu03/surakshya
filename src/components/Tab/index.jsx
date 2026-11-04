"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Tab = ({ tabs, category }) => {
  const pathname = usePathname();

  if (!Array.isArray(tabs)) {
    console.error("Expected `tabs` to be an array, but got:", tabs);
    return null;
  }

  // Get filtered tabs
  const filteredTabs = tabs
    .filter((data) => data.category === category)
    .flatMap((data) => data.routes);

  return (
    <div
      className="border w-auto h-auto lg:mx-4 md:mx-4 mx-2 my-5 bg-white flex flex-wrap justify-start"
      role="tablist"
      aria-label="Navigation tabs"
    >
      {filteredTabs.map((route) => {
        const isActive = pathname === route.path;
        return (
          <Link
            href={route.path}
            key={route.path}
            role="tab"
            aria-selected={isActive}
            className={`btn btn-sm rounded-none ${isActive ? "bg-black text-white hover:!text-white" : ""}`}
            aria-controls={`tabpanel-${route.path}`}
          >
            {route.name}
          </Link>
        );
      })}
    </div>
  );
};

export default Tab;
