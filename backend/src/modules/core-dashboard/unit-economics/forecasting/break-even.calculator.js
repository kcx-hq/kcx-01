const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const calculateBreakEven = ({
  currentCost = 0,
  currentUnitCost = 0,
  previousUnitCost = 0,
  explicitTargetUnitCost = null,
}) => {
  const cost = toNumber(currentCost);
  const current = toNumber(currentUnitCost);
  const targetCandidate = toNumber(explicitTargetUnitCost);
  const baseline = toNumber(previousUnitCost);

  const target =
    targetCandidate > 0
      ? targetCandidate
      : baseline > 0
        ? Math.min(baseline, current * 0.95)
        : current > 0
          ? current * 0.95
          : 0;

  if (target <= 0 || current <= 0) {
    return {
      targetUnitCost: null,
      gapValue: null,
      gapPct: null,
      improvementNeededPct: null,
      requiredVolumeAtCurrentCost: null,
    };
  }

  const gapValue = current - target;
  const gapPct = current > 0 ? (gapValue / current) * 100 : 0;
  const requiredVolumeAtCurrentCost = cost > 0 ? cost / target : 0;

  return {
    targetUnitCost: Number(target.toFixed(6)),
    gapValue: Number(gapValue.toFixed(6)),
    gapPct: Number(gapPct.toFixed(2)),
    improvementNeededPct: Number(Math.max(0, gapPct).toFixed(2)),
    requiredVolumeAtCurrentCost: Number(requiredVolumeAtCurrentCost.toFixed(2)),
  };
};

