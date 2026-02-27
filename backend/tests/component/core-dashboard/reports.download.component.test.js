import { describe, expect, it, vi } from "vitest";

const { generatePDFReportMock } = vi.hoisted(() => ({
  generatePDFReportMock: vi.fn(),
}));

vi.mock("../../../src/modules/core-dashboard/reports/reports.pdf.js", () => ({
  generatePDFReport: generatePDFReportMock,
}));

vi.mock("../../../src/modules/core-dashboard/reports/reports.service.js", () => ({
  reportsService: {},
}));

vi.mock("../../../src/lib/logger.js", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { downloadPDF } from "../../../src/modules/core-dashboard/reports/reports.controller.js";

function createResponse() {
  const headers = {};
  return {
    headers,
    headersSent: false,
    setHeader: vi.fn((name, value) => {
      headers[name] = value;
    }),
  };
}

function createPdfDocMock() {
  const listeners = new Map();

  return {
    pipe: vi.fn(),
    on: vi.fn((event, handler) => {
      listeners.set(event, handler);
    }),
    end: vi.fn(),
    emit: (event, value) => {
      const handler = listeners.get(event);
      if (handler) {
        handler(value);
      }
    },
  };
}

describe("core-dashboard component - reports pdf controller", () => {
  it("streams generated pdf with expected response headers", async () => {
    const req = {
      body: {
        period: "2026-06",
        totalSpend: 1200,
      },
    };
    const res = createResponse();
    const next = vi.fn();
    const doc = createPdfDocMock();

    generatePDFReportMock.mockReturnValueOnce(doc);

    await downloadPDF(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="Cloud_Cost_Optimization_Report.pdf"',
    );
    expect(generatePDFReportMock).toHaveBeenCalledWith(req.body);
    expect(doc.pipe).toHaveBeenCalledWith(res);
    expect(doc.end).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it("maps synchronous pdf generation failures to AppError", async () => {
    const req = { body: { period: "2026-06" } };
    const res = createResponse();
    const next = vi.fn();

    generatePDFReportMock.mockImplementationOnce(() => {
      throw new Error("pdf failed");
    });

    await downloadPDF(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const [error] = next.mock.calls[0];
    expect(error.name).toBe("AppError");
    expect(error.status).toBe(500);
    expect(error.code).toBe("INTERNAL");
    expect(error.message).toBe("Internal server error");
  });

  it("maps pdf stream errors to AppError when headers are not sent", async () => {
    const req = { body: { period: "2026-06" } };
    const res = createResponse();
    const next = vi.fn();
    const doc = createPdfDocMock();

    generatePDFReportMock.mockReturnValueOnce(doc);

    await downloadPDF(req, res, next);
    doc.emit("error", new Error("stream failed"));

    expect(next).toHaveBeenCalledTimes(1);
    const [error] = next.mock.calls[0];
    expect(error.name).toBe("AppError");
    expect(error.status).toBe(500);
    expect(error.code).toBe("INTERNAL");
  });
});
