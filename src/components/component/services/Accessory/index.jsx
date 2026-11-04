import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { accessoryCartFromAmount, toMoney } from "@/lib/money";

const AccessoryForm = forwardRef(
  ({ AccessoryCharge, setAccessoryCharge }, ref) => {
    const amountRef = useRef(null);
    const lastEmittedTotal = useRef(null);
    const [amount, setAmount] = useState("");

    useImperativeHandle(ref, () => ({
      focus: () => amountRef.current?.focus(),
    }));

    useEffect(() => {
      const total = toMoney(AccessoryCharge?.total);

      // Cart updates emitted by this input must not rewrite the value while the
      // user is still typing (for example, changing "5" into "5.00").
      if (lastEmittedTotal.current === total) {
        lastEmittedTotal.current = null;
        return;
      }

      setAmount(total > 0 ? String(total) : "");
    }, [AccessoryCharge?.total]);

    const handleChange = (event) => {
      const value = event.target.value;
      setAmount(value);

      if (value === "") {
        lastEmittedTotal.current = 0;
        setAccessoryCharge(accessoryCartFromAmount(0));
        return;
      }

      const numericValue = Number(value);
      if (Number.isFinite(numericValue) && numericValue >= 0) {
        const accessoryCart = accessoryCartFromAmount(numericValue);
        lastEmittedTotal.current = accessoryCart.total;
        setAccessoryCharge(accessoryCart);
      }
    };

    return (
      <div className="max-w-md">
        <label className="form-control w-full">
          <span className="label-text mb-2 font-medium">Accessory Amount</span>
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
                  AccessoryCharge?.total > 0
                    ? String(toMoney(AccessoryCharge.total))
                    : ""
                )
              }
              placeholder="Enter accessory amount"
              className="input join-item input-bordered w-full text-right"
            />
          </div>
        </label>
      </div>
    );
  }
);

AccessoryForm.displayName = "AccessoryForm";
export default AccessoryForm;
