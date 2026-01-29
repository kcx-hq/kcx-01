/**
 * Reports PDF Generator
 * PDF report generation using PDFKit
 */

import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Generate PDF report
 * @param {Object} reportData - Report data to include in PDF
 * @param {Object} reportData.period - Billing period
 * @param {number} reportData.totalSpend - Total cloud spend
 * @param {Array} reportData.topServices - Top services [{name, cost}]
 * @param {Array} reportData.topRegions - Top regions [{name, cost}]
 * @param {Object} reportData.optimizationData - Optimization data
 * @param {number} reportData.topServicePercent - Top service percentage
 * @param {number} reportData.taggedPercent - Tagged cost percentage
 * @param {number} reportData.prodPercent - Production cost percentage
 * @param {Object} options - PDF generation options
 * @returns {PDFDocument} PDF document stream
 */
export function generatePDFReport(reportData, options = {}) {
  const {
    period = new Date().toISOString().split('T')[0],
    totalSpend = 0,
    topServices = [],
    topRegions = [],
    optimizationData = {
      totalPotentialSavings: 0,
      highConfidencePercent: 0,
      underReviewPercent: 0,
      idleResources: 0,
      rightSizing: 0,
      commitments: 0
    },
    topServicePercent = 0,
    taggedPercent = 0,
    prodPercent = 0,
  } = reportData;

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const logoPath = path.join(__dirname, "../../../assets/kco_logo.png");

  /* ================= HEADER ================= */
  doc.image(logoPath, 50, 30, { width: 80 });

  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("KandCo", { align: "center" });

  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("FinOps Executive Report", { align: "center" });

  doc.moveTo(50, 120).lineTo(550, 120).stroke();

  doc.moveDown(2);
  /* ================= BILLING OVERVIEW ================= */
  doc.fontSize(14).text("Billing Overview", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).text(`Billing Period: ${period}`);
  doc.text(`Total Cloud Spend: $${Number(totalSpend).toFixed(2)} USD`);
  doc.moveDown(2);

  doc
    .fontSize(11)
    .text(
      "This report provides a summarized view of cloud spend, regional distribution, service-level costs, and optimization insights."
    );
  doc.moveDown(2);

  /* ================= TOP SERVICES ================= */
  doc.fontSize(14).text("Top Cost-Contributing Services", { underline: true });
  doc.moveDown(0.5);

  topServices.forEach((service, index) => {
    doc
      .fontSize(11)
      .text(`${index + 1}. ${service.name} — $${service.cost.toFixed(2)}`);
  });

  doc.moveDown();
  doc
    .fontSize(11)
    .text(
      `The top service contributes approximately ${topServicePercent.toFixed(
        1
      )}% of the total cloud spend.`
    );
  doc.moveDown(2);

  /* ================= REGIONS ================= */
  doc.fontSize(14).text("Regional Spend Distribution", { underline: true });
  doc.moveDown(0.5);

  topRegions.forEach((region, index) => {
    doc
      .fontSize(11)
      .text(`${index + 1}. ${region.name} — $${region.cost.toFixed(2)}`);
  });

  doc.moveDown(2);

  /* ================= OPTIMIZATION ================= */
  doc.fontSize(14).text("Cost Optimization Insights", { underline: true });
  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .text(
      `Total Potential Savings: $${optimizationData.totalPotentialSavings}`
    );
  doc.text(
    `High-Confidence Savings: ${optimizationData.highConfidencePercent}%`
  );
  doc.text(`Savings Under Review: ${optimizationData.underReviewPercent}%`);

  doc.moveDown();
  doc.text("Identified Opportunities:");
  doc.text(`• Idle Resources: ${optimizationData.idleResources}`);
  doc.text(`• Right-Sizing Candidates: ${optimizationData.rightSizing}`);
  doc.text(`• Commitment Opportunities: ${optimizationData.commitments}`);
  doc.moveDown(2);

  /* ================= GOVERNANCE ================= */
  doc.fontSize(14).text("Governance & Cost Allocation", { underline: true });
  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .text(`Tagged Spend Coverage: ${taggedPercent.toFixed(1)}% of total spend`);
  doc.text(
    `Production Environment Spend: ${prodPercent.toFixed(1)}% of total spend`
  );
  doc.moveDown(2);

  /* ================= KEY TAKEAWAYS ================= */
  doc.fontSize(14).text("Key Takeaways", { underline: true });
  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .text("• Cloud spending is well distributed across services.");
  doc.text("• Clear optimization opportunities with measurable savings.");
  doc.text("• Improved tagging will enhance cost visibility.");
  doc.text("• Cost concentration should be continuously monitored.");
  doc.moveDown(2);

  /* ================= COMING SOON ================= */
  doc.fontSize(14).text("More Insights Coming Soon", { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(11).text("• Forecasted monthly spend trends");
  doc.text("• Budget vs actual variance analysis");
  doc.text("• Automated anomaly detection");
  doc.text("• Service efficiency scoring");
  doc.text("• Intelligent optimization recommendations");

  /* ================= FOOTER ================= */
  doc.moveDown(3);
  doc.fontSize(9).text("Confidential – Generated for internal analysis only", {
    align: "center",
  });

  return doc;
}

