import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { resolveMediaUrl } from "../../utils/format";

const ZOOM_STEPS = [1, 1.5, 2, 3];

export default function ImageLightbox({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoomStep, setZoomStep] = useState(0);

  const goPrev = () => { setIndex((i) => (i - 1 + images.length) % images.length); setZoomStep(0); };
  const goNext = () => { setIndex((i) => (i + 1) % images.length); setZoomStep(0); };
  const zoomIn = () => setZoomStep((z) => Math.min(z + 1, ZOOM_STEPS.length - 1));
  const zoomOut = () => setZoomStep((z) => Math.max(z - 1, 0));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const scale = ZOOM_STEPS[zoomStep];
  const current = images[index];

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Image viewer"
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "rgba(10,11,16,.96)" }}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="f-mono text-xs" style={{ color: "rgba(255,255,255,.7)" }}>{index + 1} / {images.length}</span>
        <div className="flex items-center gap-1.5">
          <button onClick={zoomOut} disabled={zoomStep === 0} aria-label="Zoom out" className="p-2.5 rounded-full hover:bg-white/10 disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ZoomOut size={18} color="#fff" aria-hidden="true" />
          </button>
          <button onClick={zoomIn} disabled={zoomStep === ZOOM_STEPS.length - 1} aria-label="Zoom in" className="p-2.5 rounded-full hover:bg-white/10 disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ZoomIn size={18} color="#fff" aria-hidden="true" />
          </button>
          <button onClick={onClose} aria-label="Close" className="p-2.5 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={18} color="#fff" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden px-2">
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Previous image"
            className="absolute left-2 sm:left-4 z-10 p-2.5 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={22} color="#fff" aria-hidden="true" />
          </button>
        )}

        <div className={`w-full h-full flex items-center justify-center ${scale > 1 ? "overflow-auto" : "overflow-hidden"}`} onClick={(e) => e.stopPropagation()}>
          <img
            src={resolveMediaUrl(current.url)} alt=""
            className="max-w-none transition-transform duration-150"
            style={{ transform: `scale(${scale})`, maxHeight: scale === 1 ? "80vh" : "none", maxWidth: scale === 1 ? "90vw" : "none" }}
          />
        </div>

        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Next image"
            className="absolute right-2 sm:right-4 z-10 p-2.5 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronRight size={22} color="#fff" aria-hidden="true" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto shrink-0" onClick={(e) => e.stopPropagation()}>
          {images.map((img, i) => (
            <button
              key={img.id} onClick={() => { setIndex(i); setZoomStep(0); }}
              className="w-14 h-14 rounded-lg overflow-hidden shrink-0"
              style={{ outline: i === index ? "2px solid var(--turmeric)" : "2px solid transparent" }}
            >
              <img src={resolveMediaUrl(img.url)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
