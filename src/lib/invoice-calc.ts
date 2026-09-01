import Decimal from "decimal.js";

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

function money(value: string): Decimal {
  return new Decimal(value || "0");
}

function moneyString(value: Decimal): string {
  return value.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4);
}

export interface InvoiceLineInput {
  quantity: string;
  unitPrice: string;
  discount?: string;
  taxRate?: string;
}

export interface InvoiceTotals {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
}

export function calculateInvoiceTotals(lines: InvoiceLineInput[]): InvoiceTotals {
  let subtotal = new Decimal(0);
  let discountAmount = new Decimal(0);
  let taxAmount = new Decimal(0);
  let total = new Decimal(0);

  for (const line of lines) {
    const quantity = money(line.quantity);
    const unitPrice = money(line.unitPrice);
    const discount = money(line.discount ?? "0");
    const taxRate = money(line.taxRate ?? "0");
    if (quantity.lt(0) || unitPrice.lt(0) || discount.lt(0) || taxRate.lt(0)) {
      throw new Error("Invoice amounts cannot be negative");
    }
    if (taxRate.gt(100)) {
      throw new Error("Tax rate cannot exceed 100");
    }
    const lineSubtotal = quantity.times(unitPrice).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
    const lineDiscount = discount.gt(lineSubtotal)
      ? lineSubtotal
      : discount.toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
    const taxable = lineSubtotal.minus(lineDiscount);
    const lineTax = taxable.times(taxRate).dividedBy(100).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
    const lineTotal = taxable.plus(lineTax);
    subtotal = subtotal.plus(lineSubtotal);
    discountAmount = discountAmount.plus(lineDiscount);
    taxAmount = taxAmount.plus(lineTax);
    total = total.plus(lineTotal);
  }

  return {
    subtotal: moneyString(subtotal),
    discountAmount: moneyString(discountAmount),
    taxAmount: moneyString(taxAmount),
    total: moneyString(total),
  };
}

export function formatMoney(value: string, currency = "USD"): string {
  return `${currency} ${new Decimal(value || "0").toFixed(2)}`;
}
