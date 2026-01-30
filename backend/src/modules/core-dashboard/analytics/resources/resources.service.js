export const buildResourceInventory = (rows) => {
  const resourceMap = {};

  // 1. Group Raw Rows by Resource ID
  rows.forEach((row) => {
    // Since we used raw:true, nest:true, accessing data is intuitive
    const resId = row.resourceid || 'Unknown';

    if (!resourceMap[resId]) {
      resourceMap[resId] = {
        id: resId,
        // Access nested joined data
        name: row.resource?.resourcename || resId,
        service: row.service?.servicename || 'Unknown',
        region: row.region?.regionname || 'Global',
        account: row.cloudAccount?.subaccountname || 'Unknown',

        totalCost: 0,
        dailyStats: {},
        tags: row.tags || {}, // Tags come directly from Fact table
        rawMeta: row, // Keep a reference for details view
      };
    }

    const r = resourceMap[resId];
    // ✅ FIX: repository rows usually contain `billedcost`, not `totalCost`
    const cost =
      parseFloat(row.totalCost ?? row.billedcost ?? row.BilledCost ?? 0) || 0;

    const date = row.chargeperiodstart
      ? new Date(row.chargeperiodstart).toISOString().split('T')[0]
      : row.ChargePeriodStart
        ? new Date(row.ChargePeriodStart).toISOString().split('T')[0]
        : null;

    r.totalCost += cost;

    // Daily Trend Building
    if (date) {
      r.dailyStats[date] = (r.dailyStats[date] || 0) + cost;
    }
  });

  // 2. Process Logic (Zombies, Spikes)
  const inventory = Object.values(resourceMap).map((r) => {
    // Sort dates to build a time-series array
    const trend = Object.entries(r.dailyStats)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => val);

    const start = trend[0] || 0;
    const end = trend[trend.length - 1] || 0;

    let status = 'Active';
    if (end === 0 && r.totalCost > 0) status = 'Zombie';
    else if (start === 0 && end > 0) status = 'New';
    else if (end > start * 2 && start > 0.5) status = 'Spiking';

    return {
      id: r.id,
      name: r.name,
      service: r.service,
      region: r.region,
      totalCost: parseFloat(r.totalCost.toFixed(2)),
      status,
      trend,
      tags: r.tags,
      hasTags: r.tags && Object.keys(r.tags).length > 0,
      metadata: {
        ...r.rawMeta,
        Service: r.service,
        Region: r.region,
      },
    };
  });

  // 3. Stats Calculation
  const stats = {
    total: inventory.length,
    totalCost: inventory.reduce((sum, i) => sum + i.totalCost, 0),
    zombieCount: inventory.filter((i) => i.status === 'Zombie').length,
    zombieCost: inventory
      .filter((i) => i.status === 'Zombie')
      .reduce((sum, i) => sum + i.totalCost, 0),
    untaggedCount: inventory.filter((i) => !i.hasTags).length,
    untaggedCost: inventory
      .filter((i) => !i.hasTags)
      .reduce((sum, i) => sum + i.totalCost, 0),
    spikingCount: inventory.filter((i) => i.status === 'Spiking').length,
    spikingCost: inventory
      .filter((i) => i.status === 'Spiking')
      .reduce((sum, i) => sum + i.totalCost, 0),
  };

  return {
    inventory: inventory.sort((a, b) => b.totalCost - a.totalCost),
    stats,
  };
};