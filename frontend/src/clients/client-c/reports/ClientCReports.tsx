// ClientCReports.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  TrendingUp, 
  Calendar,
  BarChartIcon, 
  PieChart as PieChartIcon,
  DollarSign,
  AlertCircle,
  Loader2,
  Users,
  Tag,
  Download,
  Target,
  Shield,
  Eye,
  Clock,
  Zap
} from "lucide-react";
import type {
  ApiLikeError,
  ClientCReportsProps,
  DownloadReportPayload,
  ReportColor,
  ReportDefinition,
  ReportsData,
  ReportsExtractedData,
  ReportsMetricItem,
  ReportsSummary,
} from "./types";

const ClientCReports = ({ api, caps }: ClientCReportsProps) => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReportsData = async () => {
      if (!api || !caps?.modules?.["reports"]) {
        setError('Reports module not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all reports endpoints
        const [summaryRes, topServicesRes, monthlySpendRes] = await Promise.allSettled([
          api.call<ReportsSummary>('reports', 'summary'),
          api.call<ReportsData["topServices"]>('reports', 'topServices'),
          api.call<ReportsData["monthlySpend"]>('reports', 'monthlySpend')
        ]);

        const summaryData = summaryRes.status === 'fulfilled'
          ? (summaryRes.value ?? {
              totalSpend: 0,
              forecast: 0,
              spendChangePercent: 0,
              avgDailySpend: 0,
              dailyData: [],
              topService: { name: 'N/A', value: 0, percentage: 0 },
              topRegion: { name: 'N/A', value: 0, percentage: 0 },
              taggedCost: 0,
              untaggedCost: 0,
              prodCost: 0,
              nonProdCost: 0,
              billingPeriod: "Current Period",
              taggedPercent: 0,
              prodPercent: 0,
              departmentSplit: []
            })
          : { 
              totalSpend: 0, 
              forecast: 0, 
              spendChangePercent: 0, 
              avgDailySpend: 0,
              dailyData: [],
              topService: { name: 'N/A', value: 0, percentage: 0 },
              topRegion: { name: 'N/A', value: 0, percentage: 0 },
              taggedCost: 0,
              untaggedCost: 0,
              prodCost: 0,
              nonProdCost: 0,
              billingPeriod: "Current Period",
              taggedPercent: 0,
              prodPercent: 0,
              departmentSplit: []
            };

        const topServicesData = topServicesRes.status === 'fulfilled'
          ? (topServicesRes.value ?? { topServices: [], topRegions: [] })
          : { topServices: [], topRegions: [] };

        const monthlySpendData = monthlySpendRes.status === 'fulfilled'
          ? (monthlySpendRes.value ?? { monthlyData: [] })
          : { monthlyData: [] };

        setReportsData({
          summary: summaryData,
          topServices: topServicesData,
          monthlySpend: monthlySpendData
        });
      } catch (err: unknown) {
        const apiError = err as ApiLikeError;
        setError(apiError.message || 'Failed to fetch reports data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [api, caps]);

  const extractedData = useMemo<ReportsExtractedData>(() => {
    if (!reportsData) {
      return {
        summary: {
          totalSpend: 0,
          forecast: 0,
          spendChangePercent: 0,
          avgDailySpend: 0,
          dailyData: [],
          topService: { name: 'N/A', value: 0, percentage: 0 },
          topRegion: { name: 'N/A', value: 0, percentage: 0 },
          taggedCost: 0,
          untaggedCost: 0,
          prodCost: 0,
          nonProdCost: 0,
          billingPeriod: "Current Period",
          taggedPercent: 0,
          prodPercent: 0,
          departmentSplit: []
        },
        topServices: {
          topServices: [],
          topRegions: []
        },
        monthlySpend: {
          monthlyData: []
        },
        metadata: {
          isEmptyState: true
        }
      };
    }

    // Combine all data sources
    const summary = reportsData.summary || ({} as ReportsSummary);
    const topServices = reportsData.topServices || { topServices: [], topRegions: [] };
    const monthlySpend = reportsData.monthlySpend || { monthlyData: [] };

    return {
      summary: {
        totalSpend: summary.totalSpend || 0,
        forecast: summary.forecast || 0,
        spendChangePercent: summary.spendChangePercent || 0,
        avgDailySpend: summary.avgDailySpend || 0,
        dailyData: Array.isArray(summary.dailyData) ? summary.dailyData : [],
        topService: summary.topService || { name: 'N/A', value: 0, percentage: 0 },
        topRegion: summary.topRegion || { name: 'N/A', value: 0, percentage: 0 },
        taggedCost: summary.taggedCost || 0,
        untaggedCost: summary.untaggedCost || 0,
        prodCost: summary.prodCost || 0,
        nonProdCost: summary.nonProdCost || 0,
        billingPeriod: summary.billingPeriod || "Current Period",
        taggedPercent: summary.taggedPercent || 0,
        prodPercent: summary.prodPercent || 0,
        departmentSplit: Array.isArray(summary.departmentSplit) ? summary.departmentSplit : []
      },
      topServices: {
        topServices: Array.isArray(topServices.topServices) ? topServices.topServices : [],
        topRegions: Array.isArray(topServices.topRegions) ? topServices.topRegions : []
      },
      monthlySpend: {
        monthlyData: Array.isArray(monthlySpend.monthlyData) ? monthlySpend.monthlyData : []
      },
      metadata: {
        isEmptyState: ((summary.totalSpend || 0) === 0 && (summary.dailyData || []).length === 0)
      }
    };
  }, [reportsData]);

  // Define available reports
  const reports = useMemo<ReportDefinition[]>(() => {
    const period = reportsData?.summary?.billingPeriod || "Current Period";
    
    return [
      {
        id: "executive-cost-summary",
        title: "Executive Cost Summary",
        icon: FileText,
        frequency: "Monthly / Quarterly",
        period,
        includes: [
          "Total cloud spend overview",
          "Top services by spend",
          "Top regions by spend",
          "Spend trend summary",
          "Budget health assessment",
          "Key takeaways",
        ],
        description: "Comprehensive overview of cloud spend for leadership decision-making",
        color: "blue",
      },
      {
        id: "optimization-impact",
        title: "Optimization Impact Report",
        icon: Target,
        frequency: "Monthly",
        period,
        includes: [
          "Total potential savings analysis",
          "High-confidence recommendations",
          "Optimization opportunities under review",
          "Idle resources breakdown",
          "Right-sizing opportunities",
          "Commitment coverage analysis",
        ],
        description: "Analysis of optimization efforts and potential cost savings",
        color: "mint",
      },
      {
        id: "department-cost-allocation",
        title: "Department Cost Allocation",
        icon: Users,
        frequency: "Monthly",
        period,
        includes: [
          "Department-wise cost breakdown",
          "Cost allocation percentages",
          "Department spending trends",
          "Budget variance analysis",
          "Cost center accountability",
        ],
        description: "Detailed cost allocation across departments and teams",
        color: "green",
      },
      {
        id: "tagging-compliance",
        title: "Tagging Compliance Report",
        icon: Tag,
        frequency: "Weekly",
        period,
        includes: [
          "Tagging coverage analysis",
          "Compliance percentage",
          "Untagged resources list",
          "Tagging recommendations",
          "Cost attribution gaps",
        ],
        description: "Assessment of resource tagging compliance and cost attribution",
        color: "orange",
      },
      {
        id: "environment-split",
        title: "Environment Split Report",
        icon: Shield,
        frequency: "Monthly",
        period,
        includes: [
          "Production vs non-production costs",
          "Environment cost trends",
          "Resource utilization by environment",
          "Cost optimization opportunities",
        ],
        description: "Breakdown of costs by environment (Prod, Dev, Test)",
        color: "red",
      },
      {
        id: "daily-spending-trends",
        title: "Daily Spending Trends",
        icon: TrendingUp,
        frequency: "Daily",
        period,
        includes: [
          "Daily spend visualization",
          "Spend anomaly detection",
          "Peak usage periods",
          "Cost forecasting",
        ],
        description: "Daily spending patterns and trend analysis",
        color: "indigo",
      }
    ];
  }, [reportsData]);

  const onDownloadReport = useCallback(async (reportId: string) => {
    if (!api) {
      setError('API not available');
      return;
    }

    setDownloading(true);
    
    try {
      // Prepare report data for PDF generation
      const totalSpend = extractedData.summary.totalSpend;
      const topServices = extractedData.topServices.topServices.slice(0, 3).map((s: ReportsMetricItem) => ({
        name: s?.name || "Unknown",
        cost: s?.value ?? s?.cost ?? 0,
      }));
      const topRegions = extractedData.topServices.topRegions.slice(0, 3).map((r: ReportsMetricItem) => ({
        name: r?.name || "Unknown",
        cost: r?.value ?? r?.cost ?? 0,
      }));
      const firstTopServiceCost = topServices[0]?.cost ?? 0;

      const payload: DownloadReportPayload = {
        reportType: reportId,
        period: extractedData.summary.billingPeriod || new Date().toISOString().split('T')[0] || "",
        totalSpend: totalSpend,
        topServices,
        topRegions,
        optimizationData: {
          totalPotentialSavings: 0,
          highConfidencePercent: 0,
          underReviewPercent: 0,
          idleResources: 0,
          rightSizing: 0,
          commitments: 0,
        },
        topServicePercent: topServices.length > 0 && totalSpend > 0 ? (firstTopServiceCost / totalSpend) * 100 : 0,
        taggedPercent: extractedData.summary.taggedPercent || 0,
        prodPercent: extractedData.summary.prodPercent || 0,
      };

      try {
        const res = await api.call<Blob>("reports", "downloadPdf", {
          data: payload,
          responseType: "blob",
        });

        const blob = res;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportId}_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (apiErr: unknown) {
        const apiError = apiErr as ApiLikeError;
        // If downloadPdf endpoint is not supported, show user-friendly message
        if (apiError.message?.includes('Endpoint not supported') || apiError.message?.includes('downloadPdf')) {
          setError('PDF download endpoint is not yet available. Please try again later.');
        } else {
          throw apiErr;
        }
      }
    } catch (err: unknown) {
      const apiError = err as ApiLikeError;
      setError(apiError.message || 'Failed to download report');
    } finally {
      setDownloading(false);
    }
  }, [api, extractedData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-gray-500">
          <FileText className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-red-400 p-4">
          <AlertCircle className="mx-auto mb-2" size={32} />
          <p className="text-sm font-medium mb-1">Error Loading Data</p>
          <p className="text-xs text-gray-500 max-w-md mb-3">
            {error || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  const getColorClasses = (color: ReportColor) => {
    const colorMap: Record<ReportColor, string> = {
      blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      mint: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      green: 'bg-green-500/20 text-green-400 border border-green-500/30',
      orange: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      red: 'bg-red-500/20 text-red-400 border border-red-500/30',
      indigo: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText size={24} className="text-[#23a282]" />
          Executive Reports
        </h1>
        <p className="text-sm text-gray-400 mt-1">Download PDF reports for leadership and stakeholders</p>
      </div>
      
      <div className="flex-1 overflow-y-auto relative min-h-0">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Available Reports Grid */}
          <div className="space-y-4">
            {reports.map((report: ReportDefinition, index: number) => {
              const Icon = report.icon;
              
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 transition-all hover:border-[#23a282]/30"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${getColorClasses(report.color)}`}>
                        <Icon size={24} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">{report.title}</h3>
                          <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">
                            {report.frequency}
                          </span>
                        </div>

                        <p className="text-sm text-gray-400 mb-4">{report.description}</p>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <Calendar size={14} />
                          <span>Period: {report.period}</span>
                        </div>

                        <div className="bg-[#0f0f11] rounded-lg p-4 border border-white/5">
                          <div className="text-xs text-gray-500 mb-2 font-bold uppercase">Includes</div>
                          <ul className="space-y-1.5">
                            {report.includes.map((item: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-[#23a282] mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-white/5">
                    <button
                      onClick={() => onDownloadReport(report.id)}
                      disabled={downloading}
                      className="px-6 py-2 bg-[#23a282] hover:bg-[#23a282] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {downloading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Download PDF
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Coming Soon Reports */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-gray-400" />
                Other Reports
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-bold">
                  Coming Soon
                </span>
              </h2>
              <p className="text-sm text-gray-400 mt-1">Additional report types are in development</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                {
                  title: "Forecast & Budget Variance",
                  description: "Projected spend vs budget with variance analysis",
                  icon: TrendingUp,
                  color: "blue" as ReportColor,
                },
                {
                  title: "Compliance & Audit Report",
                  description: "Policy compliance, tagging adherence, and audit trail",
                  icon: FileText,
                  color: "green" as ReportColor,
                },
                {
                  title: "Resource Utilization Report",
                  description: "Detailed utilization metrics and efficiency analysis",
                  icon: Target,
                  color: "yellow" as ReportColor,
                },
                {
                  title: "Cost Anomaly Detection",
                  description: "Automated detection of unusual spending patterns",
                  icon: AlertCircle,
                  color: "red" as ReportColor,
                },
              ] as Array<{ title: string; description: string; icon: ReportDefinition["icon"]; color: ReportColor }>).map((r, index: number) => {
                const Icon = r.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#1a1b20]/30 backdrop-blur-md border border-white/5 rounded-xl p-5 opacity-60"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${getColorClasses(r.color)} opacity-50`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-400 mb-1">{r.title}</h3>
                        <p className="text-xs text-gray-500">{r.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCReports;
