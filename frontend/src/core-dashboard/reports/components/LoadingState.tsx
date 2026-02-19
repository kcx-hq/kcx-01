import React from "react";
import { SectionLoading } from "../../common/SectionStates";

const LoadingState = ({ label = "Analyzing Reports..." }) => {
  return <SectionLoading label={label} />;
};

export default LoadingState;
