import type { ExportResourceInventoryCsvParams, ResourceItem, ResourceTagValue } from "../types";

export function exportResourceInventoryCSV({
  activeTab,
  filteredData,
  flaggedResources,
}: ExportResourceInventoryCsvParams) {
  const dataToExport =
    activeTab === 'all'
      ? filteredData
      : activeTab === 'untagged'
        ? filteredData.filter((i: ResourceItem) => !i.hasTags)
        : activeTab === 'spiking'
          ? filteredData.filter((i: ResourceItem) => i.status === 'Spiking')
          : [];

  if (!dataToExport.length) return;

  const csvData = dataToExport.map((item: ResourceItem) => ({
    'Resource ID': item.id,
    Service: item.service || '',
    Region: item.region || '',
    Status: item.status || '',
    'Total Cost': item.totalCost || 0,
    'Flagged for Review': flaggedResources.has(item.id) ? 'Yes' : 'No',
    Tags: item.tags
      ? Object.entries(item.tags)
          .map(([k, v]: [string, ResourceTagValue]) => `${k}:${String(v ?? "")}`)
          .join('; ')
      : '',
  }));

  const headers = Object.keys(csvData[0] || {});
  const csvRows = [
    headers.join(','),
    ...csvData.map((row: Record<string, string | number>) =>
      headers
        .map((header: string) => {
          const value = row[header];
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"') || value.includes('\n'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `resource-inventory-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}



