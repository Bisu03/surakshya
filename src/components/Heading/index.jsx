import React from "react";

const Heading = ({ heading, children }) => {
  return (
    <div className="flex flex-wrap lg:flex-nowrap md:flex-nowrap items-center justify-between border-b p-4 w-full">
      <h2 className="text-lg font-medium text-gray-700">{heading}</h2>
      {children}
    </div>
  );
};

export default Heading;
