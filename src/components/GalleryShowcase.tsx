const ITEMS = [
  { src: "/generated/gallery-1.png", alt: "Toy astronaut robot among balloons" },
  { src: "/generated/gallery-2.png", alt: "Mountain range at golden hour" },
  { src: "/generated/gallery-3.png", alt: "Neon-lit futuristic city street" },
  { src: "/generated/gallery-4.png", alt: "Cozy wooden workshop" },
];

export default function GalleryShowcase() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Gallery</p>
        <h2 className="mt-2 text-3xl font-semibold">See What&apos;s Possible</h2>
        <p className="mt-2 text-muted">Every piece below started as a single prompt — generated through this product&apos;s own pipeline.</p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ITEMS.map((item) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.src}
            src={item.src}
            alt={item.alt}
            className="aspect-square w-full rounded-xl border border-border object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}
