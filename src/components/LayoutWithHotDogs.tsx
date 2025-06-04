import React from "react";
import HotDogBackground from "./HotDogBackground";

interface Props {
  children: React.ReactNode;
}

const LayoutWithHotDogs: React.FC<Props> = ({ children }) => {
  return (
    <div className="relative">
      <HotDogBackground />
      {/* content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default LayoutWithHotDogs; 