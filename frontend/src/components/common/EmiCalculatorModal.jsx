import { useMemo, useState } from "react";
import Modal from "./Modal";
import { formatPrice } from "../../utils/format";

export default function EmiCalculatorModal({ onClose, defaultPrice }) {
  const [amount, setAmount] = useState(Math.round((defaultPrice || 5000000) * 0.8));
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const { emi, totalInterest, totalPayment } = useMemo(() => {
    const r = rate / 12 / 100;
    const n = years * 12;
    if (r === 0) return { emi: amount / n, totalInterest: 0, totalPayment: amount };
    const e = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return { emi: e, totalInterest: e * n - amount, totalPayment: e * n };
  }, [amount, rate, years]);

  const principalPct = Math.round((amount / totalPayment) * 100);

  return (
    <Modal title="Loan EMI Calculator" onClose={onClose} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1"><span className="vc-eyebrow">Loan Amount</span><span className="f-mono font-semibold">{formatPrice(amount)}</span></div>
            <input type="range" min="500000" max="30000000" step="100000" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full" style={{ accentColor: "var(--brick)" }} aria-label="Loan amount" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1"><span className="vc-eyebrow">Interest Rate</span><span className="f-mono font-semibold">{rate}%</span></div>
            <input type="range" min="6" max="14" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full" style={{ accentColor: "var(--brick)" }} aria-label="Interest rate" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1"><span className="vc-eyebrow">Tenure</span><span className="f-mono font-semibold">{years} years</span></div>
            <input type="range" min="1" max="30" step="1" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full" style={{ accentColor: "var(--brick)" }} aria-label="Loan tenure in years" />
          </div>
        </div>
        <div className="vc-card p-4" style={{ background: "var(--surface)" }}>
          <div className="text-xs" style={{ color: "var(--ink-muted)" }}>Monthly EMI</div>
          <div className="f-mono text-3xl font-bold mb-4" style={{ color: "var(--brick-dark)" }}>₹{Math.round(emi).toLocaleString("en-IN")}</div>
          <div className="h-3 rounded-full overflow-hidden flex mb-2" style={{ background: "var(--line)" }}>
            <div style={{ width: `${principalPct}%`, background: "var(--brick)" }} />
            <div style={{ width: `${100 - principalPct}%`, background: "var(--turmeric)" }} />
          </div>
          <div className="flex justify-between text-xs mb-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--brick)" }} /> Principal {principalPct}%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--turmeric)" }} /> Interest {100 - principalPct}%</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b text-sm" style={{ borderColor: "var(--line)" }}>
            <span style={{ color: "var(--ink-muted)" }}>Total Interest</span><span className="f-mono font-semibold">₹{Math.round(totalInterest).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center justify-between py-2 text-sm">
            <span style={{ color: "var(--ink-muted)" }}>Total Payment</span><span className="f-mono font-semibold">₹{Math.round(totalPayment).toLocaleString("en-IN")}</span>
          </div>
          <p className="text-[11px] pt-2" style={{ color: "var(--ink-muted)" }}>Estimate only. Actual EMI depends on your lender's terms.</p>
        </div>
      </div>
    </Modal>
  );
}
