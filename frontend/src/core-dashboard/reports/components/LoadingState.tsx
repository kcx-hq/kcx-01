import React from "react";
import { SectionLoading } from "../../common/SectionStates";
import type { LoadingStateProps } from "../types";

const LoadingState = ({ label = "Analyzing Reports..." }: LoadingStateProps) => {
  return <SectionLoading label={label} />;
};

export default LoadingState;



