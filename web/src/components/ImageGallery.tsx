import { useState } from "react";

type Props = {
  images: string[];
  alt: string;
};

/**
 * Displays a primary vehicle photo with an optional horizontally-scrollable
 * thumbnail strip for switching between multiple images. When the image list
 * is empty a placeholder message is shown instead.
 *
 * @param images - Ordered list of image URLs to display.
 * @param alt    - Base alt text used for the active image; thumbnail buttons
 *                 receive auto-generated aria-labels.
 */
export function ImageGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  if (!images.length) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-500">
        No photos available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
        <img
          src={main}
          alt={images.length > 1 ? `${alt} — photo ${active + 1}` : alt}
          loading="eager"
          decoding="sync"
          className="aspect-[16/10] w-full object-cover"
        />
      </div>
      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory" role="list">
          {images.map((src, i) => (
            <li key={src} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`relative h-16 w-24 overflow-hidden rounded-lg border-2 transition min-h-[44px] min-w-[44px] sm:h-14 sm:w-20 ${
                  i === active
                    ? "border-amber-400 ring-2 ring-amber-400/30"
                    : "border-transparent opacity-80 hover:opacity-100"
                }`}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
