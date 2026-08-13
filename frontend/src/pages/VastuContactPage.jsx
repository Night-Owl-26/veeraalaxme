import { Phone, MessageCircle, Compass } from "lucide-react";
import Seo from "../components/common/Seo";

const CONTACT_NAME = import.meta.env.VITE_VASTU_CONTACT_NAME || "VeeraaLaxme Vastu Consultant";
const CONTACT_PHONE = import.meta.env.VITE_VASTU_CONTACT_PHONE || "";
const WHATSAPP_HREF = CONTACT_PHONE ? `https://wa.me/${CONTACT_PHONE.replace(/[^0-9]/g, "")}` : null;

export default function VastuContactPage() {
  return (
    <div id="main-content" className="max-w-xl mx-auto pb-8">
      <Seo
        title="Vastu Consultant for Land & Home in Chennai"
        description="Talk to a Vastu consultant about your land or home in Chennai. Call or WhatsApp for personalized Vastu guidance — not an automated score."
        path="/vastu"
      />
      <div className="vc-eyebrow mb-2">Vastu Check</div>
      <h1 className="f-display text-2xl sm:text-3xl font-semibold mb-2">Get your land or home Vastu-checked</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>
        Our Vastu checks are done directly by a person, not an automated score — call or message to discuss
        your plot or home and get guidance suited to your specific layout.
      </p>

      <div className="vc-card p-6 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "var(--brick-tint)" }}>
          <Compass size={26} style={{ color: "var(--brick)" }} aria-hidden="true" />
        </div>
        <div className="font-semibold">{CONTACT_NAME}</div>
        {CONTACT_PHONE && (
          <div className="f-mono text-lg mt-1" style={{ color: "var(--ink-soft)" }}>{CONTACT_PHONE}</div>
        )}

        {CONTACT_PHONE && (
          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <a href={`tel:${CONTACT_PHONE}`} className="vc-btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
              <Phone size={16} aria-hidden="true" /> Call now
            </a>
            {WHATSAPP_HREF && (
              <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="vc-btn-ghost flex-1 py-3 text-sm flex items-center justify-center gap-2">
                <MessageCircle size={16} aria-hidden="true" /> WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      <p className="text-xs mt-6 px-1" style={{ color: "var(--ink-muted)" }}>
        Vastu guidance is based on traditional Vastu Shastra principles and is provided for informational purposes
        only. It should not be treated as architectural, engineering, legal, financial, or guaranteed property advice.
      </p>
    </div>
  );
}
