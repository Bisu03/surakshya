/* eslint-disable react/prop-types */

import React from "react";

const MiddleSection = ({ children }) => {
  return (
    <div className="w-full lg:mx-6 md:mx-8 mx-2 my-5 mb-20 p-4 bg-white">
      {children}
    </div>
  );
};

export default MiddleSection;
