import { ShieldCheck, Compass, MessageCircle, Ban, MapPin } from "lucide-react";
import Seo from "../components/common/Seo";

const PRINCIPLES = [
  {
    icon: Compass,
    title: "Vastu is computed, not guessed",
    body: "Every Vastu score comes from a fixed rule engine — facing, entrance, kitchen and pooja placement, and more — evaluated the same way every time. AI is only ever used to explain a score in plain language after it's already been calculated; it never invents or adjusts the number itself.",
  },
  {
    icon: ShieldCheck,
    title: "Real sellers, verified sign-up",
    body: "Every seller verifies their email with a one-time code before they can post. Admins can additionally mark a seller as verified after checking their documents, shown as a badge on their listings.",
  },
  {
    icon: MessageCircle,
    title: "Talk directly, no middleman",
    body: "Buyers and sellers message each other directly through the built-in chat — no broker fees, no forwarding through a call center.",
  },
  {
    icon: Ban,
    title: "No fake listings, no inflated numbers",
    body: "Listings are checked for duplicate photos and unusual posting patterns, and can be reported or taken down by an admin. What you see is what a real seller posted.",
  },
];

export default function AboutPage() {
  return (
    <div id="main-content" className="max-w-2xl mx-auto pb-8">
      <Seo
        title="About VeeraaLaxme Vastu"
        description="VeeraaLaxme Vastu is a Vastu-aware property marketplace — verified listings, a deterministic Vastu scoring engine, and direct buyer-seller chat, with no brokers in between."
        path="/about"
      />
      <div className="vc-eyebrow mb-2">About</div>
      <h1 className="f-display text-2xl sm:text-3xl font-semibold mb-3">Vastu-aware, verified, direct</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>
        VeeraaLaxme Vastu is a property marketplace built around one idea: buying or selling land and homes
        in India shouldn't mean choosing between a good deal and a Vastu-compatible one. Every listing carries
        a real, rule-based Vastu score alongside the usual price, area, and location details — so it's part of
        the decision from the start, not an afterthought.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {PRINCIPLES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="vc-card p-5">
            <span className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "var(--brick-tint)" }}>
              <Icon size={18} style={{ color: "var(--brick)" }} aria-hidden="true" />
            </span>
            <h2 className="font-semibold text-sm mb-1.5">{title}</h2>
            <p className="text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>{body}</p>
          </div>
        ))}
      </div>

      <div className="vc-card p-5 mb-8">
        <div className="vc-eyebrow mb-2">Registered Address</div>
        <div className="flex items-start gap-2.5">
          <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: "var(--brick)" }} aria-hidden="true" />
          <address className="text-sm not-italic leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            Veeraa Laxme Sevaa<br />
            Site No: 44, 45, Saravana Bhava Nagar,<br />
            Manimahal South Side Housing Unit,<br />
            Mudalipalayam Panchayat, Tirupur – 641606
          </address>
        </div>
      </div>

      <p className="text-xs px-1" style={{ color: "var(--ink-muted)" }}>
        Vastu guidance on this platform is based on traditional Vastu Shastra principles and is provided for
        informational purposes only — it is not architectural, engineering, legal, financial, or guaranteed
        property advice.
      </p>
    </div>
  );
}
