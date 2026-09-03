"use client";

const FacebookIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 13.5h2.5l1-3.5H14V7.8c0-.9.2-1.3 1.2-1.3h1.8V3.2c-.3-.1-1.3-.2-2.5-.2-2.5 0-4.3 1.5-4.3 4.4V10H7v3.5h3.2V22h3.8v-8.5z" />
  </svg>
);
const XIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.254 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const LinkedInIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
  </svg>
);
const ShareIcon = () => (
  <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342a3 3 0 100-2.684m0 2.684a3 3 0 100 2.684m0-2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 5.684a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);

export default function ShareLinks({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { label: "Facebook", icon: <FacebookIcon />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "X (Twitter)", icon: <XIcon />, href: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { label: "LinkedIn", icon: <LinkedInIcon />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled — no-op
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${link.label}`}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-steel-gray hover:border-[#7A5418] hover:text-[#7A5418] transition-colors"
        >
          {link.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Share"
        className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-steel-gray hover:border-[#7A5418] hover:text-[#7A5418] transition-colors"
      >
        <ShareIcon />
      </button>
    </div>
  );
}
