import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { medicineCartFromAmount, toMoney } from "@/lib/money";

const MedicineForm = forwardRef(
  ({ MedicineCharge, setMedicineCharge }, ref) => {
    const amountRef = useRef(null);
    const lastEmittedTotal = useRef(null);
    const [amount, setAmount] = useState("");

    useImperativeHandle(ref, () => ({
      focus: () => amountRef.current?.focus(),
    }));

    useEffect(() => {
      const total = toMoney(MedicineCharge?.total);

      // Cart updates emitted by this input must not rewrite the value while the
      // user is still typing (for example, changing "5" into "5.00").
      if (lastEmittedTotal.current === total) {
        lastEmittedTotal.current = null;
        return;
      }

      setAmount(total > 0 ? String(total) : "");
    }, [MedicineCharge?.total]);

    const handleChange = (event) => {
      const value = event.target.value;
      setAmount(value);

      if (value === "") {
        lastEmittedTotal.current = 0;
        setMedicineCharge(medicineCartFromAmount(0));
        return;
      }

      const numericValue = Number(value);
      if (Number.isFinite(numericValue) && numericValue >= 0) {
        const medicineCart = medicineCartFromAmount(numericValue);
        lastEmittedTotal.current = medicineCart.total;
        setMedicineCharge(medicineCart);
      }
    };

    return (
      <div className="max-w-md">
        <label className="form-control w-full">
          <span className="label-text mb-2 font-medium">Medicine Amount</span>
          <div className="join w-full">
            <span className="join-item flex items-center border border-r-0 border-base-300 bg-base-200 px-4">
              ₹
            </span>
            <input
              ref={amountRef}
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={handleChange}
              onBlur={() =>
                setAmount(
                  MedicineCharge?.total > 0
                    ? String(toMoney(MedicineCharge.total))
                    : ""
                )
              }
              placeholder="Enter medicine amount"
              className="input join-item input-bordered w-full text-right"
            />
          </div>
        </label>
      </div>
    );
  }
);

MedicineForm.displayName = "MedicineForm";
export default MedicineForm;
