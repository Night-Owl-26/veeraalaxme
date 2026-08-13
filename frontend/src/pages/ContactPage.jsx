import { useState } from "react";
import { Phone, MessageCircle, Mail, Send } from "lucide-react";
import { contactApi } from "../api/contact";
import { useToast } from "../context/ToastContext";
import Input from "../components/common/Input";
import FormField from "../components/common/FormField";
import Seo from "../components/common/Seo";

const CONTACT_PHONE = import.meta.env.VITE_VASTU_CONTACT_PHONE || "";
const WHATSAPP_HREF = CONTACT_PHONE ? `https://wa.me/${CONTACT_PHONE.replace(/[^0-9]/g, "")}` : null;

export default function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (name.trim().length < 2) nextErrors.name = "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter a valid email address";
    if (message.trim().length < 10) nextErrors.message = "Add a bit more detail (10+ characters)";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      await contactApi.submit({ name, email, message });
      setSent(true);
      showToast("Message sent — we'll get back to you by email");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="main-content" className="max-w-xl mx-auto pb-8">
      <Seo
        title="Contact Us"
        description="Get in touch with VeeraaLaxme Vastu — call, WhatsApp, or send a message for support, listing issues, or general questions."
        path="/contact"
      />
      <div className="vc-eyebrow mb-2">Contact</div>
      <h1 className="f-display text-2xl sm:text-3xl font-semibold mb-2">Get in touch</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>
        Questions about a listing, your account, or anything else — reach us directly.
      </p>

      {CONTACT_PHONE && (
        <div className="vc-card p-5 mb-6 flex flex-col sm:flex-row gap-2">
          <a href={`tel:${CONTACT_PHONE}`} className="vc-btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
            <Phone size={16} aria-hidden="true" /> Call {CONTACT_PHONE}
          </a>
          {WHATSAPP_HREF && (
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="vc-btn-ghost flex-1 py-3 text-sm flex items-center justify-center gap-2">
              <MessageCircle size={16} aria-hidden="true" /> WhatsApp
            </a>
          )}
        </div>
      )}

      <div className="vc-card p-6">
        {sent ? (
          <div className="text-center py-4">
            <span className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "var(--banyan-tint)" }}>
              <Mail size={24} style={{ color: "var(--banyan)" }} aria-hidden="true" />
            </span>
            <p className="font-semibold">Message sent</p>
            <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>Thanks — we'll reply to your email shortly.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <FormField label="Your name" htmlFor="name" error={errors.name}>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Divya Raman" error={errors.name} autoComplete="name" />
            </FormField>
            <FormField label="Your email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} autoComplete="email" />
            </FormField>
            <FormField label="Message" htmlFor="message" error={errors.message}>
              <textarea
                id="message" rows={5} className={`vc-input ${errors.message ? "invalid" : ""}`}
                value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
              />
            </FormField>
            <button type="submit" disabled={busy} className="vc-btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
              <Send size={15} aria-hidden="true" /> {busy ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
