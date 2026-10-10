"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type InViewVideoProps = {
  src: string;
  /** What the film shows, read out by screen readers. */
  label: string;
  /** Shape, corners and shadow of the frame. */
  className?: string;
  /** Which part of the film stays in view when the frame crops it. */
  objectPosition?: string;
  /** The still shown until the film has loaded. */
  poster?: string;
};

/** A silent looping film that is fetched and played only while on screen, with a button to pause it. */
const InViewVideo = ({ src, label, className = "", objectPosition = "center", poster }: InViewVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Set once the visitor presses pause, so scrolling back does not start the film against their wish.
  const pausedByVisitor = useRef(false);

  // The film never starts by itself for visitors who ask for less motion.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!reduceMotion && !pausedByVisitor.current) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      pausedByVisitor.current = false;
      video.play().catch(() => {});
    } else {
      pausedByVisitor.current = true;
      video.pause();
    }
  };

  return (
    <div className={`relative overflow-hidden bg-blueberry ${className}`}>
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition }}
        muted
        loop
        playsInline
        preload="none"
        poster={poster}
        aria-label={label}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={src} type="video/webm" />
      </video>
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Pause the film" : "Play the film"}
        className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full border border-white/50 bg-black/35 text-white backdrop-blur-sm transition-colors duration-300 hover:bg-white hover:text-blueberry"
      >
        {isPlaying ? <Pause aria-hidden="true" className="size-5" /> : <Play aria-hidden="true" className="ml-0.5 size-5" />}
      </button>
    </div>
  );
};

export default InViewVideo;
