import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useReactToPrint } from "react-to-print";

const PrintUi = ({ children, path }) => {
  const contentRef = useRef(null);
  const reactToPrintFn = useReactToPrint({ contentRef });
  return (
    <div className="p-4">
      <div
        ref={contentRef}
        className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none"
      >
        {children}
      </div>

      <div className="mt-6 flex justify-center gap-4 print:hidden">
        <button
          onClick={() => reactToPrintFn()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Print A4
        </button>
        {path && <Link
          href={path}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back
        </Link>}
      </div>
    </div>
  );
};

export default PrintUi;