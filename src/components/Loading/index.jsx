import React from "react";
import { LifeLine } from "react-loading-indicators";

const Loading = () => {
  return (
    <>
      <div className="flex items-center justify-center h-screen w-full relative z-10 bg-gray-100">
        <LifeLine color="#3135cc" size="medium" text="" textColor="" />
      </div>

    </>
  );
};

export default Loading;
