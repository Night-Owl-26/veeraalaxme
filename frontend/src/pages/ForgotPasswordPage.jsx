import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { authApi } from "../api/auth";
import { useToast } from "../context/ToastContext";
import Input from "../components/common/Input";
import FormField from "../components/common/FormField";
import CompassLogo from "../components/property/CompassLogo";
import Seo from "../components/common/Seo";
import { phoneSchema, passwordSchema, otpSchema } from "../utils/validation";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [stage, setStage] = useState("phone"); // "phone" | "reset"
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submitPhone = async (e) => {
    e.preventDefault();
    if (!phoneSchema.safeParse(phone).success) { setErrors({ phone: "Enter a valid phone number" }); return; }
    setErrors({});
    setBusy(true);
    try {
      const data = await authApi.forgotPassword({ phone });
      setStage("reset");
      showToast(data.message);
    } catch (err) {
      setErrors({ phone: err.message });
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!otpSchema.safeParse(code).success) nextErrors.code = "Enter the 6-digit code";
    if (!passwordSchema.safeParse(newPassword).success) nextErrors.newPassword = "Password must be at least 8 characters";
    if (confirmPassword !== newPassword) nextErrors.confirmPassword = "Passwords don't match";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      await authApi.resetPassword({ phone, code, newPassword });
      showToast("Password reset — log in with your new password");
      navigate("/login", { replace: true });
    } catch (err) {
      setErrors({ code: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "var(--surface)" }}>
      <Seo title="Reset password" noindex />
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <CompassLogo size={40} />
          <h1 className="f-display text-2xl font-semibold mt-3">Reset your password</h1>
          <p className="text-sm mt-1 text-center" style={{ color: "var(--ink-muted)" }}>
            We'll email a verification code to the address on your account.
          </p>
        </div>

        <div className="vc-card p-6">
          {stage === "phone" && (
            <form onSubmit={submitPhone} className="space-y-4" noValidate>
              <FormField label="Phone number" htmlFor="phone" error={errors.phone}>
                <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" error={errors.phone} autoComplete="tel" autoFocus />
              </FormField>
              <button type="submit" disabled={busy} className="vc-btn-primary w-full py-3 text-sm">
                {busy ? "Sending code…" : "Send reset code"}
              </button>
            </form>
          )}

          {stage === "reset" && (
            <form onSubmit={submitReset} className="space-y-4" noValidate>
              <button type="button" onClick={() => setStage("phone")} className="flex items-center gap-1 text-xs font-semibold mb-1" style={{ color: "var(--ink-muted)" }}>
                <ArrowLeft size={13} /> Change number
              </button>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} style={{ color: "var(--banyan)" }} />
                <p className="text-sm">If that account exists, a code was emailed to it.</p>
              </div>
              <FormField label="6-digit code" htmlFor="code" error={errors.code}>
                <Input id="code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••" error={errors.code} className="text-center f-mono text-lg tracking-[0.3em]" autoFocus />
              </FormField>
              <FormField label="New password" htmlFor="newPassword" error={errors.newPassword}>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" error={errors.newPassword} autoComplete="new-password" />
              </FormField>
              <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" error={errors.confirmPassword} autoComplete="new-password" />
              </FormField>
              <button type="submit" disabled={busy} className="vc-btn-primary w-full py-3 text-sm">
                {busy ? "Resetting…" : "Reset password"}
              </button>
              <button type="button" onClick={submitPhone} className="w-full text-center text-xs font-semibold" style={{ color: "var(--brick)" }}>
                Resend code
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "var(--ink-muted)" }}>
          <Link to="/login" className="underline">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
