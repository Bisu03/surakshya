export function toMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

export function medicineItemAmount(item) {
  if (item?.amount !== undefined) return toMoney(item.amount);
  return toMoney(toMoney(item?.mrp) * toMoney(item?.quantity));
}

export function normalizeMedicineCart(cart = {}) {
  const items = Array.isArray(cart?.items)
    ? cart.items
        .filter((item) => typeof item?.name === "string" && item.name.trim())
        .map((item) => ({
          itemID: String(item.itemID || ""),
          name: item.name.trim(),
          amount: medicineItemAmount(item),
        }))
    : [];

  return {
    items,
    total: toMoney(items.reduce((sum, item) => sum + item.amount, 0)),
  };
}

export function medicineCartFromAmount(value) {
  const amount = toMoney(value);
  return {
    items:
      amount > 0
        ? [{ itemID: "medicine-charge", name: "Medicine Charges", amount }]
        : [],
    total: amount,
  };
}

export function accessoryCartFromAmount(value) {
  const amount = toMoney(value);
  return {
    items:
      amount > 0
        ? [{ itemID: "accessory-charge", name: "Accessory Charges", amount }]
        : [],
    total: amount,
  };
}

export function cartTotal(cart = {}, rateField, quantityField) {
  if (!Array.isArray(cart?.items)) return 0;
  return toMoney(
    cart.items.reduce(
      (sum, item) =>
        sum + toMoney(item?.[rateField]) * toMoney(item?.[quantityField]),
      0
    )
  );
}

export function calculateBill({
  consultantCart,
  serviceCart,
  medicineCart,
  accessoryCart,
  discount,
  previouslyPaid,
  newPayment,
}) {
  const consultantTotal = cartTotal(consultantCart, "charge", "doctor_visit");
  const serviceTotal = cartTotal(serviceCart, "unitcharge", "unit");
  const normalizedMedicine = normalizeMedicineCart(medicineCart);
  const normalizedAccessory = normalizeMedicineCart(accessoryCart);
  const total = toMoney(
    consultantTotal +
      serviceTotal +
      normalizedMedicine.total +
      normalizedAccessory.total
  );
  const safeDiscount = Math.min(toMoney(discount), total);
  const netTotal = toMoney(total - safeDiscount);
  const paid = toMoney(toMoney(previouslyPaid) + toMoney(newPayment));
  const due = toMoney(Math.max(netTotal - paid, 0));

  return {
    medicineCart: normalizedMedicine,
    accessoryCart: normalizedAccessory,
    amount: { total, discount: safeDiscount, netTotal, paid, due },
  };
}
