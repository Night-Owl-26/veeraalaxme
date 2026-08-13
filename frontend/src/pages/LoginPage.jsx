import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Input from "../components/common/Input";
import FormField from "../components/common/FormField";
import { phoneSchema, emailSchema, passwordSchema, otpSchema } from "../utils/validation";
import Seo from "../components/common/Seo";
import lakshmiBg from "../assets/lakshmi-bg.webp";

export default function LoginPage() {
  const { login, registerRequestOtp, registerVerifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [stage, setStage] = useState("form"); // "form" | "otp" (register only)

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("BUYER");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";

  const switchMode = (m) => {
    setMode(m);
    setStage("form");
    setErrors({});
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!phoneSchema.safeParse(phone).success) nextErrors.phone = "Enter a valid phone number";
    if (!password) nextErrors.password = "Enter your password";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      await login(phone, password);
      showToast("Welcome back");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors({ password: err.message });
    } finally {
      setBusy(false);
    }
  };

  const submitRegisterForm = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (name.trim().length < 2) nextErrors.name = "Enter your name";
    if (!phoneSchema.safeParse(phone).success) nextErrors.phone = "Enter a valid phone number";
    if (!emailSchema.safeParse(email).success) nextErrors.email = "Enter a valid email address";
    if (!passwordSchema.safeParse(password).success) nextErrors.password = "Password must be at least 8 characters";
    if (confirmPassword !== password) nextErrors.confirmPassword = "Passwords don't match";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      await registerRequestOtp({ name, phone, email, password, role });
      setStage("otp");
      showToast("Verification code sent to your email");
    } catch (err) {
      setErrors({ email: err.message });
    } finally {
      setBusy(false);
    }
  };

  const submitRegisterOtp = async (e) => {
    e.preventDefault();
    if (!otpSchema.safeParse(code).success) { setErrors({ code: "Enter the 6-digit code" }); return; }
    setBusy(true);
    try {
      await registerVerifyOtp({ name, phone, email, password, role }, code);
      showToast("Welcome to VeeraaLaxme Vastu");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors({ code: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "var(--surface)" }}>
      <Seo title="Log in or sign up" noindex />
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <img
            src={lakshmiBg} alt=""
            className="w-16 h-16 rounded-full object-cover"
            style={{ border: "2px solid var(--turmeric)", boxShadow: "0 2px 8px rgba(27,31,46,.12)" }}
          />
          <h1 className="f-display text-2xl font-semibold mt-3">
            VeeraaLaxme<span style={{ color: "var(--brick)", fontStyle: "italic" }}> Vastu</span>
          </h1>
          <p className="text-sm mt-1 text-center" style={{ color: "var(--ink-muted)" }}>Verified land & property listings, Vastu-aware.</p>
        </div>

        <div className="vc-card p-6">
          <div className="flex rounded-full p-1 mb-5" style={{ background: "var(--surface)" }}>
            {["login", "register"].map((m) => (
              <button
                key={m} type="button" onClick={() => switchMode(m)}
                className="flex-1 py-2 text-sm font-semibold rounded-full transition-colors"
                style={mode === m ? { background: "var(--ink)", color: "#fff" } : { color: "var(--ink-muted)" }}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {mode === "login" && (
            <form onSubmit={submitLogin} className="space-y-4" noValidate>
              <FormField label="Phone number" htmlFor="phone" error={errors.phone}>
                <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" error={errors.phone} autoComplete="tel" />
              </FormField>
              <FormField label="Password" htmlFor="password" error={errors.password}>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" error={errors.password} autoComplete="current-password" />
              </FormField>
              <div className="text-right -mt-2">
                <Link to="/forgot-password" className="text-xs font-semibold" style={{ color: "var(--brick)" }}>Forgot password?</Link>
              </div>
              <button type="submit" disabled={busy} className="vc-btn-primary w-full py-3 text-sm">
                {busy ? "Logging in…" : "Log in"}
              </button>
            </form>
          )}

          {mode === "register" && stage === "form" && (
            <form onSubmit={submitRegisterForm} className="space-y-4" noValidate>
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
              <FormField label="Phone number" htmlFor="phone" error={errors.phone}>
                <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" error={errors.phone} autoComplete="tel" />
              </FormField>
              <FormField label="Email address" htmlFor="email" error={errors.email} hint="We'll send a 6-digit code to verify it's you.">
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} autoComplete="email" />
              </FormField>
              <FormField label="Password" htmlFor="password" error={errors.password}>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" error={errors.password} autoComplete="new-password" />
              </FormField>
              <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" error={errors.confirmPassword} autoComplete="new-password" />
              </FormField>
              <button type="submit" disabled={busy} className="vc-btn-primary w-full py-3 text-sm">
                {busy ? "Sending code…" : "Send verification code"}
              </button>
            </form>
          )}

          {mode === "register" && stage === "otp" && (
            <form onSubmit={submitRegisterOtp} className="space-y-4" noValidate>
              <button type="button" onClick={() => setStage("form")} className="flex items-center gap-1 text-xs font-semibold mb-1" style={{ color: "var(--ink-muted)" }}>
                <ArrowLeft size={13} /> Edit details
              </button>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} style={{ color: "var(--banyan)" }} />
                <p className="text-sm">Code sent to <span className="font-semibold">{email}</span></p>
              </div>
              <FormField label="6-digit code" htmlFor="code" error={errors.code}>
                <Input id="code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••" error={errors.code} className="text-center f-mono text-lg tracking-[0.3em]" autoFocus />
              </FormField>
              <button type="submit" disabled={busy} className="vc-btn-primary w-full py-3 text-sm">
                {busy ? "Verifying…" : "Verify & create account"}
              </button>
              <button type="button" onClick={submitRegisterForm} className="w-full text-center text-xs font-semibold" style={{ color: "var(--brick)" }}>
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
