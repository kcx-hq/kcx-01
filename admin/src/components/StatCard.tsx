type StatCardProps = {
  label: string;
  value: number | string;
  helper?: string;
  tone?: "neutral" | "blue" | "orange" | "red";
};

const StatCard = ({ label, value, helper, tone = "neutral" }: StatCardProps) => {
  const toneClass = tone === "neutral" ? "" : `tone-${tone}`;
  return (
    <div className={`kpi-card ${toneClass}`.trim()}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {helper ? <div className="helper">{helper}</div> : null}
    </div>
  );
};

export default StatCard;
