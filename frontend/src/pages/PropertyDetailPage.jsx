import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  ArrowLeft, Heart, Bookmark, Scale, Share2, MapPin, Phone, MessageCircle,
  ShieldCheck, Calculator, Sparkles, Loader2, CheckCircle2, Send, Droplets, Zap, Lock,
} from "lucide-react";
import { propertiesApi } from "../api/properties";
import { aiApi } from "../api/ai";
import { chatApi } from "../api/chat";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useCompare } from "../context/CompareContext";
import { usePropertyActions } from "../hooks/usePropertyActions";
import PropertyThumb from "../components/property/PropertyThumb";
import ImageLightbox from "../components/property/ImageLightbox";
import PropertyReels from "../components/property/PropertyReels";
import Seo from "../components/common/Seo";
import VastuGauge from "../components/property/VastuGauge";
import Pill from "../components/property/Pill";
import MapView from "../components/property/MapView";
import Spinner from "../components/common/Spinner";
import EmiCalculatorModal from "../components/common/EmiCalculatorModal";
import { formatPrice, initials, timeAgo, resolveMediaUrl } from "../utils/format";

const NEARBY_ICONS = [
  { key: "school", label: "School" }, { key: "hospital", label: "Hospital" },
  { key: "bus", label: "Bus Stand" }, { key: "railway", label: "Railway" }, { key: "airport", label: "Airport" },
];

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { compareIds, toggleCompare } = useCompare();
  const { toggleLike, toggleSave } = usePropertyActions();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [showEmi, setShowEmi] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTab("overview");
    setAiInsight(null);
    propertiesApi.getById(id)
      .then((d) => { if (!cancelled) setProperty(d.property); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const applyLocal = (_id, patch) => {
    setProperty((p) => {
      const next = { ...p, ...patch };
      if ("_liked" in patch) next.likes = p.likes + (patch._liked ? 1 : -1);
      return next;
    });
  };

  const getVastuInsight = async () => {
    setAiLoading(true); setAiError(null);
    try {
      const { text } = await aiApi.vastuInsight({ facing: property.vastu.facing, kitchenDir: property.vastu.kitchenDir, poojaRoom: property.vastu.poojaRoom });
      setAiInsight(text);
    } catch (e) {
      setAiError(e.message || "Couldn't reach the AI advisor right now.");
    } finally {
      setAiLoading(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) { showToast("Log in to comment"); return; }
    setPostingComment(true);
    try {
      const { comment } = await propertiesApi.comment(id, commentText.trim());
      setProperty((p) => ({ ...p, comments: [...p.comments, comment] }));
      setCommentText("");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setPostingComment(false);
    }
  };

  const startChat = async () => {
    if (!user) { showToast("Log in to message the seller"); navigate("/login"); return; }
    setStartingChat(true);
    try {
      const { thread } = await chatApi.startThread(property.seller.id, property.id);
      navigate(`/chat/${thread.id}`);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) return <Spinner label="Loading listing…" />;
  if (error || !property) return (
    <div className="vc-card p-8 text-center max-w-md mx-auto">
      <p className="font-semibold mb-1">Listing not found</p>
      <p className="text-sm mb-4" style={{ color: "var(--ink-muted)" }}>{error || "This listing may have been removed."}</p>
      <Link to="/" className="vc-btn-primary inline-block px-4 py-2 text-sm">Back to listings</Link>
    </div>
  );

  const inCompare = compareIds.includes(property.id);
  const metaDescription = `${property.type} in ${property.locality}, ${property.city} — ${formatPrice(property.price)}${property.priceUnit || ""}. Vastu score ${property.vastu.score}/100. ${property.description}`.slice(0, 160);

  return (
    <div id="main-content">
      <Seo
        title={`${property.title} — ${property.locality}, ${property.city}`}
        description={metaDescription}
        path={`/property/${property.slug || property.id}`}
        image={property.images?.[0]?.url}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: property.title,
          description: property.description,
          url: `${typeof window !== "undefined" ? window.location.origin : ""}/property/${property.slug || property.id}`,
          image: property.images?.[0]?.url,
          address: {
            "@type": "PostalAddress",
            addressLocality: property.locality,
            addressRegion: property.city,
            addressCountry: "IN",
          },
          ...(property.location
            ? { geo: { "@type": "GeoCoordinates", latitude: property.location.lat, longitude: property.location.lng } }
            : {}),
          offers: {
            "@type": "Offer",
            price: property.price,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
          },
        }}
      />
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold mb-4 min-h-[44px]" style={{ color: "var(--ink-soft)" }}>
        <ArrowLeft size={15} aria-hidden="true" /> Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <button
            type="button" onClick={() => property.images?.length && setLightboxIndex(0)}
            className="vc-card overflow-hidden mb-2 w-full block text-left cursor-zoom-in"
            aria-label="View larger image"
          >
            <PropertyThumb property={property} height="h-64 sm:h-80" />
          </button>

          {property.images?.length > 1 && (
            <div className="flex gap-2 mb-5 overflow-x-auto">
              {property.images.map((img, i) => (
                <button
                  key={img.id} type="button" onClick={() => setLightboxIndex(i)}
                  className="w-16 h-16 rounded-lg overflow-hidden shrink-0"
                  style={{ border: "1px solid var(--line)" }}
                >
                  <img
                    src={resolveMediaUrl(img.url)}
                    alt="" className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          {(!property.images || property.images.length <= 1) && <div className="mb-5" />}

          {lightboxIndex !== null && property.images?.length > 0 && (
            <ImageLightbox
              images={property.images} initialIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          )}

          <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
            <div>
              <div className="vc-eyebrow mb-1">{property.type}</div>
              <h1 className="f-display text-2xl sm:text-3xl font-semibold leading-tight">{property.title}</h1>
              <div className="flex items-center gap-1 text-sm mt-1.5" style={{ color: "var(--ink-muted)" }}>
                <MapPin size={13} aria-hidden="true" /> {property.locality}, {property.city}
              </div>
            </div>
            <div className="text-right">
              <div className="f-mono text-xl sm:text-2xl font-bold" style={{ color: "var(--brick-dark)" }}>{formatPrice(property.price)}{property.priceUnit || ""}</div>
              {property.negotiable && <div className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>Negotiable</div>}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 mb-5 flex-wrap">
            <button onClick={() => toggleLike(property.id, applyLocal)} aria-pressed={property._liked} className="vc-btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm font-semibold min-h-[44px]">
              <Heart size={14} fill={property._liked ? "var(--brick)" : "none"} color={property._liked ? "var(--brick)" : "var(--ink-soft)"} aria-hidden="true" /> {property.likes}
            </button>
            <button onClick={() => toggleSave(property.id, applyLocal)} aria-pressed={property._saved} className="vc-btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm font-semibold min-h-[44px]">
              <Bookmark size={14} fill={property._saved ? "var(--turmeric)" : "none"} color={property._saved ? "var(--turmeric)" : "var(--ink-soft)"} aria-hidden="true" /> {property._saved ? "Saved" : "Save"}
            </button>
            <button onClick={() => toggleCompare(property.id)} aria-pressed={inCompare} className="vc-btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm font-semibold min-h-[44px]">
              <Scale size={14} color={inCompare ? "var(--brick)" : "var(--ink-soft)"} aria-hidden="true" /> {inCompare ? "In compare" : "Compare"}
            </button>
            <button onClick={() => { navigator.clipboard?.writeText?.(window.location.href); showToast("Link copied"); }} className="vc-btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm font-semibold min-h-[44px]">
              <Share2 size={14} aria-hidden="true" /> Share
            </button>
          </div>

          <div role="tablist" className="flex gap-4 border-b mb-5 overflow-x-auto" style={{ borderColor: "var(--line)" }}>
            {[["overview", "Overview"], ["vastu", "Vastu"], ["location", "Location & Nearby"], ["documents", "Documents"]].map(([tid, label]) => (
              <button key={tid} role="tab" aria-selected={tab === tid} onClick={() => setTab(tid)} className={`vc-tab pb-2.5 whitespace-nowrap ${tab === tid ? "active" : ""}`}>{label}</button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{property.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox label="Area" value={property.areaLabel} />
                {property.bedrooms && <StatBox label="Bedrooms" value={property.bedrooms} />}
                {property.bathrooms && <StatBox label="Bathrooms" value={property.bathrooms} />}
                <StatBox label="Facing" value={property.vastu.facing + "-facing"} />
                {property.amenities.road && <StatBox label="Road" value={property.amenities.road} />}
                {property.ownership && <StatBox label="Ownership" value={property.ownership} />}
              </div>
              <div>
                <div className="vc-eyebrow mb-2">Amenities</div>
                <div className="flex gap-2 flex-wrap">
                  <Pill tone={property.amenities.water ? "banyan" : "neutral"} icon={Droplets}>{property.amenities.water ? "Water Available" : "No Water Source"}</Pill>
                  <Pill tone={property.amenities.electricity ? "banyan" : "neutral"} icon={Zap}>{property.amenities.electricity ? "Electricity" : "No Electricity"}</Pill>
                  <Pill tone={property.amenities.compoundWall ? "banyan" : "neutral"}>{property.amenities.compoundWall ? "Compound Wall" : "No Compound Wall"}</Pill>
                  <Pill tone={property.loanAvailable ? "banyan" : "neutral"}>{property.loanAvailable ? "Loan Available" : "Loan Not Offered"}</Pill>
                </div>
              </div>
              <div>
                <div className="vc-eyebrow mb-3">Comments</div>
                <div className="space-y-3 mb-4">
                  {property.comments.length === 0 && <p className="text-sm" style={{ color: "var(--ink-muted)" }}>No comments yet — ask the seller something.</p>}
                  {property.comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center f-mono text-[10px] font-bold" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>{initials(c.user.name)}</span>
                      <div className="vc-card px-3 py-2 text-sm flex-1">
                        <span className="font-semibold">{c.user.name}</span> {c.text}
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>{timeAgo(c.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={submitComment} className="flex gap-2">
                  <input className="vc-input" placeholder="Ask the seller a question…" value={commentText} onChange={(e) => setCommentText(e.target.value)} aria-label="Add a comment" />
                  <button type="submit" disabled={postingComment} className="vc-btn-primary px-3.5 min-w-[44px]"><Send size={15} /></button>
                </form>
              </div>
            </div>
          )}

          {tab === "vastu" && (
            <div className="space-y-5">
              <div className="vc-card p-5 flex items-center gap-5 flex-wrap">
                <VastuGauge score={property.vastu.score} facing={property.vastu.facing} size={96} />
                <div className="flex-1 min-w-[180px]">
                  <div className="text-sm" style={{ color: "var(--ink-muted)" }}>Overall Vastu Score</div>
                  <div className="f-display text-2xl font-semibold">{property.vastu.score >= 80 ? "Excellent" : property.vastu.score >= 60 ? "Good" : "Fair"} Vastu</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox label="Entrance" value={property.vastu.entranceDir + "-facing"} />
                <StatBox label="Kitchen" value={property.vastu.kitchenDir + " side"} />
                <StatBox label="Pooja Room" value={property.vastu.poojaRoom ? "Yes" : "No"} />
              </div>
              <div className="vc-card p-4">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} style={{ color: "var(--brick)" }} aria-hidden="true" />
                    <span className="font-semibold text-sm">AI Vastu Insights</span>
                  </div>
                  {!aiInsight && (
                    <button onClick={getVastuInsight} disabled={aiLoading} className="vc-btn-primary text-xs px-3 py-2 flex items-center gap-1.5 min-h-[36px]">
                      {aiLoading ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />} {aiLoading ? "Thinking…" : "Get Insights"}
                    </button>
                  )}
                </div>
                {aiInsight && <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{aiInsight}</p>}
                {aiError && <p className="text-sm" style={{ color: "var(--brick)" }}>{aiError}</p>}
                {!aiInsight && !aiError && !aiLoading && <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Illustrative only, generated live — not professional consultation.</p>}
              </div>
            </div>
          )}

          {tab === "location" && (
            authLoading ? null : user ? (
              <div className="space-y-5">
                <MapView lat={property.location?.lat} lng={property.location?.lng} label={property.title} height="h-48 sm:h-64" />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {NEARBY_ICONS.map(({ key, label }) => property.nearby?.[key] !== undefined && (
                    <div key={key} className="vc-card p-3 text-center">
                      <div className="f-mono text-sm font-bold">{property.nearby[key]} km</div>
                      <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <LoginGate
                routerLocation={routerLocation}
                title="Log in to see the exact location"
                body="Sign in to view the map pin and distances to nearby schools, hospitals, and transit."
              />
            )
          )}

          {tab === "documents" && (
            authLoading ? null : user ? (
              <div className="space-y-3">
                {property.surveyNumber && (
                  <div className="flex items-center justify-between py-2 border-b text-sm" style={{ borderColor: "var(--line)" }}>
                    <span style={{ color: "var(--ink-muted)" }}>Survey Number</span><span className="f-mono font-semibold">{property.surveyNumber}</span>
                  </div>
                )}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm"><CheckCircle2 size={15} color="var(--banyan)" aria-hidden="true" /> Phone Verified</div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={15} color={property.documentsVerified ? "var(--banyan)" : "var(--line)"} aria-hidden="true" />
                    <span style={{ color: property.documentsVerified ? "var(--ink)" : "var(--ink-muted)" }}>Documents Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={15} color={property.seller?.verified ? "var(--banyan)" : "var(--line)"} aria-hidden="true" />
                    <span style={{ color: property.seller?.verified ? "var(--ink)" : "var(--ink-muted)" }}>Seller Verified</span>
                  </div>
                </div>
                <p className="text-xs pt-2" style={{ color: "var(--ink-muted)" }}>Full survey and registration numbers are shared with buyers only after a verified inquiry, to protect against fraud.</p>
              </div>
            ) : (
              <LoginGate
                routerLocation={routerLocation}
                title="Log in to see verification details"
                body="Sign in to view survey number, document verification, and seller verification status."
              />
            )
          )}
        </div>

        <div className="space-y-4">
          <div className="vc-card p-4">
            <div className="vc-eyebrow mb-3">Seller</div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-11 h-11 rounded-full flex items-center justify-center f-mono text-sm font-bold" style={{ background: "var(--banyan-tint)", color: "var(--banyan)" }}>
                {initials(property.seller?.name)}
              </span>
              <div>
                <div className="font-semibold text-sm flex items-center gap-1">{property.seller?.name} {property.seller?.verified && <ShieldCheck size={13} style={{ color: "var(--banyan)" }} aria-label="Verified seller" />}</div>
              </div>
            </div>
            <div className="space-y-2">
              {authLoading ? null : user ? (
                <>
                  <a href={`tel:${property.seller?.phone}`} className="vc-btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 min-h-[44px]">
                    <Phone size={14} aria-hidden="true" /> Call {property.seller?.phone}
                  </a>
                  <a
                    href={`https://wa.me/${(property.seller?.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in your listing "${property.title}" on VeeraaLaxme Vastu.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="vc-btn-ghost w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 min-h-[44px]" style={{ borderColor: "var(--banyan)", color: "var(--banyan)" }}
                  >
                    <MessageCircle size={14} aria-hidden="true" /> WhatsApp Seller
                  </a>
                  <button onClick={startChat} disabled={startingChat} className="vc-btn-ghost w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 min-h-[44px]">
                    <MessageCircle size={14} aria-hidden="true" /> Message on VeeraaLaxme Vastu
                  </button>
                </>
              ) : (
                <div className="rounded-lg p-3.5 text-center" style={{ background: "var(--surface)", border: "1px dashed var(--line)" }}>
                  <Lock size={16} className="mx-auto mb-1.5" style={{ color: "var(--ink-muted)" }} aria-hidden="true" />
                  <p className="text-xs mb-3" style={{ color: "var(--ink-muted)" }}>Log in to see the seller's phone number and message them directly.</p>
                  <Link to="/login" state={{ from: routerLocation }} className="vc-btn-primary w-full py-2.5 text-sm inline-block">Log in to contact seller</Link>
                </div>
              )}
              <button onClick={() => setShowEmi(true)} className="vc-btn-ghost w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 min-h-[44px]">
                <Calculator size={14} aria-hidden="true" /> Calculate EMI
              </button>
            </div>
          </div>
          <div className="vc-card p-4">
            <div className="vc-eyebrow mb-2">Posted</div>
            <p className="text-sm">{timeAgo(property.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <PropertyReels excludeId={property.id} />
      </div>

      {showEmi && <EmiCalculatorModal onClose={() => setShowEmi(false)} defaultPrice={property.price} />}
    </div>
  );
}

function LoginGate({ routerLocation, title, body }) {
  return (
    <div className="vc-card p-6 text-center">
      <Lock size={20} style={{ color: "var(--ink-muted)" }} className="mx-auto mb-2" aria-hidden="true" />
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className="text-xs mb-4 max-w-xs mx-auto" style={{ color: "var(--ink-muted)" }}>{body}</p>
      <Link to="/login" state={{ from: routerLocation }} className="vc-btn-primary inline-block px-4 py-2 text-sm">Log in to view</Link>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="vc-card p-3">
      <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}
