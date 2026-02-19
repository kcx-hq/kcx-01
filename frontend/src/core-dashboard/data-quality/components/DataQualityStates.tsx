import { SectionLoading, SectionEmpty } from "../../common/SectionStates";

const DataQualityStates = ({ type }) => {
  if (type === "loading") return <SectionLoading label="Analyzing Data Quality..." />;
  return <SectionEmpty message="No data available" />;
};

export { DataQualityStates };
export default DataQualityStates;
