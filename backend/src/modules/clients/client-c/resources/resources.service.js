import { buildResourceInventory } from '../../../../modules/core-dashboard/analytics/resources/resources.service.js';

/**
 * Client-C Resource Enhancements
 * - Department ownership awareness
 * - Mandatory tagging by department
 * - Alert-driven spike detection
 */
export const buildClientCResourceInventory = (rows, options = {}) => {
  const base = buildResourceInventory(rows);

  const { departmentTagKey = 'department' } = options;

  // Enhance inventory with department info and compliance
  const enhancedInventory = base.inventory.map((resource) => {
    const department =
      resource.tags?.[departmentTagKey] ||
      resource.tags?.Department ||
      'Unassigned';

    const isDepartmentMissing = department === 'Unassigned';

    return {
      ...resource,
      department,
      compliance: {
        hasDepartment: !isDepartmentMissing,
        isTagCompliant: resource.hasTags && !isDepartmentMissing
      }
    };
  });

  // Calculate statistics by department
  const zombiesByDepartment = {};
  const spikesByDepartment = {};
  const departmentViolations = [];

  enhancedInventory.forEach((r) => {
    const dept = r.department;
    
    if (r.status === 'Zombie') {
      zombiesByDepartment[dept] = (zombiesByDepartment[dept] || 0) + 1;
    }
    
    if (r.status === 'Spiking') {
      spikesByDepartment[dept] = (spikesByDepartment[dept] || 0) + 1;
    }

    if (!r.compliance.hasDepartment) {
      departmentViolations.push(r);
    }
  });

  return {
    inventory: enhancedInventory,
    stats: {
      ...base.stats,
      departmentViolationCount: departmentViolations.length,
      departmentViolationCost: departmentViolations.reduce(
        (sum, r) => sum + r.totalCost,
        0
      ),
      zombiesByDepartment,
      spikesByDepartment
    }
  };
};
