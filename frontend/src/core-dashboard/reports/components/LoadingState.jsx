import React from "react";
import { SectionLoading } from "../../common/SectionStates.jsx";

const LoadingState = ({ label = "Analyzing Reports..." }) => {
  return <SectionLoading label={label} />;
};

export default LoadingState;
