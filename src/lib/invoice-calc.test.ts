import { describe, expect, it } from "vitest";
import { calculateInvoiceTotals } from "./invoice-calc";

describe("frontend invoice preview totals", () => {
  it("matches backend rounding for tax after discount", () => {
    const totals = calculateInvoiceTotals([
      { quantity: "1", unitPrice: "100", discount: "10", taxRate: "13" },
      { quantity: "2", unitPrice: "25", taxRate: "0" },
    ]);

    expect(totals.subtotal).toBe("150.0000");
    expect(totals.discountAmount).toBe("10.0000");
    expect(totals.taxAmount).toBe("11.7000");
    expect(totals.total).toBe("151.7000");
  });

  it("rejects negative amounts and tax rates over 100", () => {
    expect(() =>
      calculateInvoiceTotals([{ quantity: "-1", unitPrice: "10" }]),
    ).toThrow("Invoice amounts cannot be negative");
    expect(() =>
      calculateInvoiceTotals([{ quantity: "1", unitPrice: "10", taxRate: "101" }]),
    ).toThrow("Tax rate cannot exceed 100");
  });
});
