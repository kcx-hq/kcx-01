import { SectionLoading, SectionEmpty } from "../../common/SectionStates";
import type { DataQualityStatesProps } from "../types";

const DataQualityStates = ({ type }: DataQualityStatesProps) => {
  if (type === "loading") return <SectionLoading label="Analyzing Data Quality..." />;
  return <SectionEmpty message="No data available" />;
};

export { DataQualityStates };
export default DataQualityStates;



