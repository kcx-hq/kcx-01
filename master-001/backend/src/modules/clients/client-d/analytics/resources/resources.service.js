/**
 * Client-D Resource Inventory Builder
 * Differences vs core:
 * - Removes Zombie/Spiking/New status logic
 * - Keeps untagged visibility
 * - Adds Availability Zone (if present in rows)
 */

export const buildClientDResourceInventory = (rows = []) => {
  const resourceMap = {};

  // 1) Group rows by resourceId
  rows.forEach((row) => {
    const resId = row.resourceid || row.resource?.resourceid || 'Unknown';

    if (!resourceMap[resId]) {
      // Best-effort extraction of Availability Zone from raw row
      // Adjust keys based on your fact schema if needed
      const availabilityZone =
        row.availabilityzone ||
        row.AvailabilityZone ||
        row.zone ||
        row.Zone ||
        row.az ||
        row.AZ ||
        row.resource?.availabilityzone ||
        null;

      resourceMap[resId] = {
        id: resId,
        name: row.resource?.resourcename || row.resourcename || resId,
        service: row.service?.servicename || row.servicename || 'Unknown',
        region: row.region?.regionname || row.regionname || 'Global',
        account: row.cloudAccount?.subaccountname || row.subaccountname || 'Unknown',
        availabilityZone,
        totalCost: 0,
        dailyStats: {},
        tags: row.tags || {},
        rawMeta: row
      };
    }

    const r = resourceMap[resId];

    const cost =
      parseFloat(row.totalCost ?? row.billedcost ?? row.BilledCost ?? 0) || 0;

    const date = row.chargeperiodstart
      ? new Date(row.chargeperiodstart).toISOString().split('T')[0]
      : row.ChargePeriodStart
        ? new Date(row.ChargePeriodStart).toISOString().split('T')[0]
        : null;

    r.totalCost += cost;

    if (date) {
      r.dailyStats[date] = (r.dailyStats[date] || 0) + cost;
    }

    // If AZ appears only on some rows, keep first non-null
    if (!r.availabilityZone) {
      const az =
        row.availabilityzone ||
        row.AvailabilityZone ||
        row.zone ||
        row.Zone ||
        row.az ||
        row.AZ ||
        null;
      if (az) r.availabilityZone = az;
    }
  });

  // 2) Build inventory (NO zombie/spiking logic)
  const inventory = Object.values(resourceMap).map((r) => {
    const trend = Object.entries(r.dailyStats)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => val);

    return {
      id: r.id,
      name: r.name,
      service: r.service,
      region: r.region,
      availabilityZone: r.availabilityZone, // ✅ Client-D field
      totalCost: parseFloat(r.totalCost.toFixed(2)),
      trend,
      tags: r.tags,
      hasTags: r.tags && Object.keys(r.tags).length > 0,
      metadata: {
        ...r.rawMeta,
        Service: r.service,
        Region: r.region,
        AvailabilityZone: r.availabilityZone
      }
    };
  });

  // 3) Stats (NO zombie/spiking)
  const stats = {
    total: inventory.length,
    totalCost: inventory.reduce((sum, i) => sum + i.totalCost, 0),
    untaggedCount: inventory.filter((i) => !i.hasTags).length,
    untaggedCost: inventory
      .filter((i) => !i.hasTags)
      .reduce((sum, i) => sum + i.totalCost, 0)
  };

  return {
    inventory: inventory.sort((a, b) => b.totalCost - a.totalCost),
    stats
  };
};
