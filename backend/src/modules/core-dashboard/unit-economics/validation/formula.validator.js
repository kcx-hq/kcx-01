export const validateFormulaBalance = ({ expected = 0, actual = 0, epsilon = 0.05 }) => {
  const diff = Number((Number(expected) - Number(actual)).toFixed(6));
  return {
    isBalanced: Math.abs(diff) <= epsilon,
    difference: diff,
    epsilon,
  };
};

