import type { CostDriversControlsState } from '../types';

export const DEFAULT_ACTIVE_TAB = 'service';

export const INITIAL_COST_DRIVERS_CONTROLS: CostDriversControlsState = {
  timeRange: '30d',
  compareTo: 'previous_period',
  costBasis: 'actual',
  dimension: 'service',
  startDate: '',
  endDate: '',
  previousStartDate: '',
  previousEndDate: '',
  minChange: 0,
  rowLimit: 100,
};
