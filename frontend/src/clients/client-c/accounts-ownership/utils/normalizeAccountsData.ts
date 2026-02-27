import type {
  AccountItem,
  AccountsRawData,
  ComplianceDepartmentItem,
  ComplianceRawData,
  DepartmentMergedItem,
  NormalizedAccountsData,
  NormalizedComplianceData,
  NormalizedSummaryData,
  SummaryRawData,
} from "../types";

export function normalizeAccountsData(accountsData: AccountsRawData | null): NormalizedAccountsData {
  if (!accountsData || typeof accountsData !== "object") {
    return {
      accounts: [],
      totalAccounts: 0,
      ownedAccounts: 0,
      unownedAccounts: 0,
      ownershipRate: 0,
      spendWithOwner: 0,
      spendWithoutOwner: 0,
      totalSpend: 0,
    };
  }

  const accounts = Array.isArray(accountsData.accounts) ? accountsData.accounts : [];
  const insights = accountsData.insights || {};
  
  const totalAccounts = insights.totalAccounts || accounts.length;
  const ownedAccounts = insights.accountsWithOwner || accounts.filter((account: AccountItem) => account.owner).length;
  const unownedAccounts = insights.accountsWithoutOwner || (totalAccounts - ownedAccounts);
  const ownershipRate = totalAccounts > 0 ? Math.round((ownedAccounts / totalAccounts) * 100) : 0;
  
  const spendWithOwner = insights.spendWithOwner || 0;
  const spendWithoutOwner = insights.spendWithoutOwner || 0;
  const totalSpend = insights.totalSpend || (spendWithOwner + spendWithoutOwner);

  return {
    accounts,
    totalAccounts,
    ownedAccounts,
    unownedAccounts,
    ownershipRate,
    spendWithOwner,
    spendWithoutOwner,
    totalSpend,
  };
}

export function normalizeComplianceData(complianceData: ComplianceRawData | null): NormalizedComplianceData {
  if (!complianceData || typeof complianceData !== "object") {
    return {
      overall: {
        taggedCost: 0,
        untaggedCost: 0,
        taggedPercent: 0,
      },
      byDepartment: [],
      compliant: 0,
      nonCompliant: 0,
      complianceRate: 0,
      taggedCount: 0,
      untaggedCount: 0,
      countCompliancePercent: 0,
      costCompliancePercent: 0,
    };
  }

  const overall: NormalizedComplianceData["overall"] = {
    taggedCost: complianceData.taggedCost || 0,
    untaggedCost: complianceData.untaggedCost || 0,
    taggedPercent: complianceData.taggedPercent || 0,
    untaggedPercent: complianceData.untaggedPercent || 0,
  };

  const byDepartment = Array.isArray(complianceData.byDepartment) 
    ? complianceData.byDepartment 
    : [];

  const totalResources = overall.taggedCost + overall.untaggedCost;
  const compliant = overall.taggedCost;
  const nonCompliant = overall.untaggedCost;
  const complianceRate = totalResources > 0 ? Math.round((compliant / totalResources) * 100) : 0;

  return {
    overall,
    byDepartment,
    compliant,
    nonCompliant,
    complianceRate,
    taggedCount: complianceData.taggedCount || 0,
    untaggedCount: complianceData.untaggedCount || 0,
    countCompliancePercent: complianceData.countCompliancePercent || 0,
    costCompliancePercent: complianceData.costCompliancePercent || 0,
  };
}

export function normalizeSummaryData(summaryData: SummaryRawData | null): NormalizedSummaryData {
  if (!summaryData || typeof summaryData !== "object") {
    return {
      totalAccounts: 0,
      totalDepartments: 0,
      ownershipRate: 0,
      complianceRate: 0,
      overallScore: 0,
      tagCompliance: { taggedCost: 0, untaggedCost: 0, taggedPercent: 0 },
      ownershipGaps: { ownedCount: 0, unownedCount: 0, ownershipPercentValue: 0 },
    };
  }

  const tagCompliance = {
    taggedCost: summaryData.tagCompliance?.taggedCost ?? 0,
    untaggedCost: summaryData.tagCompliance?.untaggedCost ?? 0,
    taggedPercent: summaryData.tagCompliance?.taggedPercent ?? 0,
  };
  const ownershipGaps = {
    ownedCount: summaryData.ownershipGaps?.ownedCount ?? 0,
    unownedCount: summaryData.ownershipGaps?.unownedCount ?? 0,
    ownershipPercentValue: summaryData.ownershipGaps?.ownershipPercentValue ?? 0,
  };
  
  return {
    totalAccounts: summaryData.totalAccounts || 0,
    totalDepartments: summaryData.totalDepartments || 0,
    ownershipRate: ownershipGaps.ownershipPercentValue || 0,
    complianceRate: tagCompliance.taggedPercent || 0,
    overallScore: summaryData.overallScoreValue || 0,
    tagCompliance,
    ownershipGaps,
  };
}

export function mergeAccountData(
  accounts: NormalizedAccountsData,
  ownership: SummaryRawData | null,
  compliance: NormalizedComplianceData,
): DepartmentMergedItem[] {
  // Extract departments from compliance data
  const departments: Record<string, {
    totalCost: number;
    ownedCost: number;
    unownedCost: number;
    compliantCost: number;
    nonCompliantCost: number;
    complianceRate: number;
    count: number;
    taggedCount: number;
    untaggedCount: number;
  }> = {};
  
  if (compliance?.byDepartment) {
    compliance.byDepartment.forEach((dept: ComplianceDepartmentItem) => {
      const departmentName = dept.department || "N/A";
      departments[departmentName] = {
        totalCost: Number(dept.totalCost || 0),
        ownedCost: 0,
        unownedCost: 0,
        compliantCost: Number(dept.taggedCost || 0),
        nonCompliantCost: Number(dept.untaggedCost || 0),
        complianceRate: Number(dept.compliancePercent || 0),
        count: 0,
        taggedCount: 0,
        untaggedCount: 0,
      };
    });
  }

  // Merge account ownership with departments
  if (accounts?.accounts) {
    accounts.accounts.forEach((account: AccountItem) => {
      const dept = account.department || 'N/A';
      if (departments[dept]) {
        if (account.owner) {
          departments[dept].ownedCost += Number(account.totalSpend || 0);
        } else {
          departments[dept].unownedCost += Number(account.totalSpend || 0);
        }
        departments[dept].count += 1;
        if (account.owner) departments[dept].taggedCount += 1;
        else departments[dept].untaggedCount += 1;
      } else {
        departments[dept] = {
          totalCost: Number(account.totalSpend || 0),
          ownedCost: account.owner ? Number(account.totalSpend || 0) : 0,
          unownedCost: account.owner ? 0 : Number(account.totalSpend || 0),
          compliantCost: 0,
          nonCompliantCost: 0,
          complianceRate: 0,
          count: 1,
          taggedCount: account.owner ? 1 : 0,
          untaggedCount: account.owner ? 0 : 1,
        };
      }
    });
  }

  return Object.entries(departments).map(([name, stats]) => ({
    name,
    totalCost: Number(stats.totalCost || 0).toFixed(2),
    ownedCost: Number(stats.ownedCost || 0).toFixed(2),
    unownedCost: Number(stats.unownedCost || 0).toFixed(2),
    compliantCost: Number(stats.compliantCost || 0).toFixed(2),
    nonCompliantCost: Number(stats.nonCompliantCost || 0).toFixed(2),
    ownershipRate: stats.totalCost > 0 
      ? parseFloat(((stats.ownedCost / stats.totalCost) * 100).toFixed(2))
      : 0,
    complianceRate: stats.totalCost > 0 
      ? parseFloat(((stats.compliantCost / stats.totalCost) * 100).toFixed(2))
      : 0,
    count: stats.count || 0,
    taggedCount: stats.taggedCount || 0,
    untaggedCount: stats.untaggedCount || 0,
  })).sort((a, b) => parseFloat(b.totalCost) - parseFloat(a.totalCost));
}
