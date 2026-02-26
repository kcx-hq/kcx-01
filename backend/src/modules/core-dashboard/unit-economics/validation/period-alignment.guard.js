const toDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export const validatePeriodAlignment = ({
  costWindow = {},
  volumeWindow = {},
}) => {
  const costStart = toDate(costWindow.startDate);
  const costEnd = toDate(costWindow.endDate);
  const volumeStart = toDate(volumeWindow.startDate);
  const volumeEnd = toDate(volumeWindow.endDate);

  const aligned =
    Boolean(costStart && costEnd && volumeStart && volumeEnd) &&
    costStart.getTime() === volumeStart.getTime() &&
    costEnd.getTime() === volumeEnd.getTime();

  return {
    aligned,
    costWindow: {
      startDate: costStart ? costStart.toISOString() : null,
      endDate: costEnd ? costEnd.toISOString() : null,
    },
    volumeWindow: {
      startDate: volumeStart ? volumeStart.toISOString() : null,
      endDate: volumeEnd ? volumeEnd.toISOString() : null,
    },
  };
};

