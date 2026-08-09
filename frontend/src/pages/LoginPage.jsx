import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Input from "../components/common/Input";
import FormField from "../components/common/FormField";
import CompassLogo from "../components/property/CompassLogo";
import { phoneSchema, otpSchema } from "../utils/validation";

export default function LoginPage() {
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [stage, setStage] = useState("phone"); // "phone" | "otp"
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("BUYER");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";

  const submitPhone = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!phoneSchema.safeParse(phone).success) nextErrors.phone = "Enter a valid phone number";
    if (mode === "register" && name.trim().length < 2) nextErrors.name = "Enter your name";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      await requestOtp(phone, mode, mode === "register" ? { name, role } : {});
      setStage("otp");
      showToast("Verification code sent");
    } catch (err) {
      setErrors({ phone: err.message });
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    if (!otpSchema.safeParse(code).success) { setErrors({ code: "Enter the 6-digit code" }); return; }
    setBusy(true);
    try {
      await verifyOtp(phone, code, mode, mode === "register" ? { name, role } : {});
      showToast(mode === "register" ? "Welcome to VasthuConnect" : "Welcome back");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors({ code: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "var(--surface)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <CompassLogo size={40} />
          <h1 className="f-display text-2xl font-semibold mt-3">
            Vasthu<span style={{ color: "var(--brick)", fontStyle: "italic" }}>Connect</span>
          </h1>
          <p className="text-sm mt-1 text-center" style={{ color: "var(--ink-muted)" }}>Verified land & property listings, Vastu-aware.</p>
        </div>

        <div className="vc-card p-6">
          {stage === "phone" && (
            <>
              <div className="flex rounded-full p-1 mb-5" style={{ background: "var(--surface)" }}>
                {["login", "register"].map((m) => (
                  <button
                    key={m} type="button" onClick={() => { setMode(m); setErrors({}); }}
                    className="flex-1 py-2 text-sm font-semibold rounded-full transition-colors"
                    style={mode === m ? { background: "var(--ink)", color: "#fff" } : { color: "var(--ink-muted)" }}
                  >
                    {m === "login" ? "Log in" : "Sign up"}
                  </button>
                ))}
              </div>

              <form onSubmit={submitPhone} className="space-y-4" noValidate>
                {mode === "register" && (
                  <>
                    <FormField label="Full name" htmlFor="name" error={errors.name}>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Divya Raman" error={errors.name} autoComplete="name" />
                    </FormField>
                    <FormField label="I am a">
                      <div className="grid grid-cols-2 gap-2">
                        {["BUYER", "SELLER"].map((r) => (
                          <button
                            key={r} type="button" onClick={() => setRole(r)}
                            className="py-2.5 rounded-lg text-sm font-semibold border capitalize"
                            style={role === r ? { borderColor: "var(--brick)", background: "var(--brick-tint)", color: "var(--brick-dark)" } : { borderColor: "var(--line)", color: "var(--ink-soft)" }}
                          >
                            {r.toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </FormField>
                  </>
                )}
                <FormField label="Phone number" htmlFor="phone" error={errors.phone} hint="We'll send a 6-digit code to verify it's you.">
                  <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" error={errors.phone} autoComplete="tel" />
                </FormField>
                <button type="submit" disabled={busy} className="vc-btn-primary w-full py-3 text-sm">
                  {busy ? "Sending code…" : "Send verification code"}
                </button>
              </form>
            </>
          )}

          {stage === "otp" && (
            <form onSubmit={submitOtp} className="space-y-4" noValidate>
              <button type="button" onClick={() => setStage("phone")} className="flex items-center gap-1 text-xs font-semibold mb-1" style={{ color: "var(--ink-muted)" }}>
                <ArrowLeft size={13} /> Change number
              </button>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} style={{ color: "var(--banyan)" }} />
                <p className="text-sm">Code sent to <span className="font-semibold">{phone}</span></p>
              </div>
              <FormField label="6-digit code" htmlFor="code" error={errors.code}>
                <Input id="code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••" error={errors.code} className="text-center f-mono text-lg tracking-[0.3em]" autoFocus />
              </FormField>
              <button type="submit" disabled={busy} className="vc-btn-primary w-full py-3 text-sm">
                {busy ? "Verifying…" : "Verify & continue"}
              </button>
              <button type="button" onClick={submitPhone} className="w-full text-center text-xs font-semibold" style={{ color: "var(--brick)" }}>
                Resend code
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "var(--ink-muted)" }}>
          <Link to="/" className="underline">Continue browsing without an account</Link>
        </p>
      </div>
    </div>
  );
}
