import Image from "next/image";

type SpaceVisualProps = {
  /** Path of the photograph; when missing, the drawn placeholder is shown. */
  image?: string;
  /** Line drawing for the placeholder. */
  drawing: string;
  alt: string;
  sizes: string;
  priority?: boolean;
};

/** A photograph, or a drawn placeholder in the palette until the photograph is supplied. */
const SpaceVisual = ({ image, drawing, alt, sizes, priority = false }: SpaceVisualProps) => {
  if (image) {
    return <Image src={image} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-berry-bloom via-[#77829b] to-stem-grey">
      <svg viewBox="0 0 24 24" className="h-2/5 w-2/5 fill-none stroke-white/45" strokeWidth="0.25" strokeLinejoin="round">
        <path d={drawing} />
      </svg>
    </div>
  );
};

export default SpaceVisual;
