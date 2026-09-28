import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { VideoOff } from "lucide-react";

type HlsPlayerProps = {
  url: string;
  cameraName: string;
};

export default function HlsPlayer({
  url,
  cameraName,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !url) {
      return;
    }

    let hls: Hls | null = null;

    setError(null);

    // Safari / WebKit native HLS support
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;

      video.play().catch(() => undefined);

      return () => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

    // Chrome / Edge / Firefox
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => undefined);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) {
          return;
        }

        setError("Unable to play this live stream.");

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls?.startLoad();
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError();
        }
      });

      return () => {
        hls?.destroy();
      };
    }

    setError("This browser does not support HLS playback.");
  }, [url]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <VideoOff className="h-7 w-7 text-slate-700" />

        <p className="mt-2 text-xs text-slate-500">
          {error}
        </p>

        <p className="mt-1 text-[11px] text-slate-700">
          {cameraName}
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        controls
        aria-label={`Live video from ${cameraName}`}
      />

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[10px] text-emerald-300 backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        LIVE
      </div>
    </div>
  );
}