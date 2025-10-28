// components/HandCaptureModal.tsx
import { useState, useEffect, useRef, useCallback } from "react";

interface HandCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (photoUrl: string) => void;
}

declare global {
  interface Window {
    Hands: any;
    drawLandmarks: any;
    drawConnectors: any;
    HAND_CONNECTIONS: any;
  }
}

export function HandCaptureModal({
  isOpen,
  onClose,
  onPhotoCaptured,
}: HandCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [fingerCount, setFingerCount] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);

  const handsRef = useRef<any>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const stableFingerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadMediaPipeScripts = useCallback(async () => {
    if (window.Hands && window.drawLandmarks && window.HAND_CONNECTIONS) return;

    const scripts = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
    ];

    for (const src of scripts) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    }
  }, []);

  const countFingers = useCallback((landmarks: any[], handedness: string) => {
    const tips = [4, 8, 12, 16, 20];
    let count = 0;
    if (handedness === "Right") {
      if (landmarks[4]?.x < landmarks[2]?.x) count++;
    } else {
      if (landmarks[4]?.x > landmarks[2]?.x) count++;
    }
    for (let i = 1; i < tips.length; i++) {
      const tip = tips[i];
      const pip = tip - 2;
      if (landmarks[tip]?.y < landmarks[pip]?.y) count++;
    }
    return count;
  }, []);

  useEffect(() => {
    if (!isOpen || loading || cameraError || isCountingDown) return;

    const currentFinger = fingerCount;

    if (currentStep === 0 && currentFinger === 1) {
      setCurrentStep(1);
    } else if (currentStep === 1 && currentFinger === 2) {
      setCurrentStep(2);
    } else if (currentStep === 2 && currentFinger === 3) {
      if (stableFingerTimerRef.current)
        clearTimeout(stableFingerTimerRef.current);
      stableFingerTimerRef.current = setTimeout(() => {
        setIsCountingDown(true);
        setCountdown(3);
      }, 1000);
    } else if (
      currentFinger !== null &&
      currentFinger !== currentStep + 1 &&
      currentFinger !== currentStep
    ) {
      resetSequence();
    } else if (currentFinger === null && currentStep > 0) {
      resetSequence();
    }

    return () => {
      if (stableFingerTimerRef.current) {
        clearTimeout(stableFingerTimerRef.current);
        stableFingerTimerRef.current = null;
      }
    };
  }, [fingerCount, currentStep, isOpen, loading, cameraError, isCountingDown]);

  useEffect(() => {
    if (isCountingDown && countdown > 0) {
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current as unknown as number);
            countdownIntervalRef.current = null;
            capturePhoto();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current as unknown as number);
        countdownIntervalRef.current = null;
      }
    };
  }, [isCountingDown, countdown]);

  const resetSequence = () => {
    if (isCountingDown) return;
    setCurrentStep(0);
    setCountdown(0);
    setIsCountingDown(false);
    if (stableFingerTimerRef.current) {
      clearTimeout(stableFingerTimerRef.current);
      stableFingerTimerRef.current = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoUrl = canvas.toDataURL("image/png");
    onPhotoCaptured(photoUrl);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      resetSequence();
      return;
    }

    let isMounted = true;

    const initCameraAndHands = async () => {
      try {
        setLoading(true);
        setCameraError(null);

        await loadMediaPipeScripts();

        const hands = new window.Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: any) => {
          if (!isMounted) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.multiHandLandmarks?.length) {
            const landmarks = results.multiHandLandmarks[0];
            const handedness = results.multiHandedness?.[0]?.label || "Right";
            const fingers = countFingers(landmarks, handedness);
            setFingerCount(fingers);

            window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
              color: "#00FF00",
              lineWidth: 2,
            });
            window.drawLandmarks(ctx, landmarks, {
              color: "#FF0000",
              lineWidth: 1,
              radius: 3,
            });
          } else {
            setFingerCount(null);
          }
        });

        handsRef.current = hands;

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: false,
          });
          streamRef.current = stream;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setCameraError(`Camera access denied or unavailable: ${msg}`);
          setLoading(false);
          return;
        }

        const video = videoRef.current;
        if (!video) {
          setLoading(false);
          return;
        }

        video.srcObject = stream;

        video.addEventListener(
          "loadedmetadata",
          async () => {
            if (!isMounted) return;
            setTimeout(async () => {
              try {
                await video.play();
              } catch (playErr) {
                const msg =
                  playErr instanceof Error ? playErr.message : String(playErr);
                setCameraError(`Failed to play video: ${msg}`);
                setLoading(false);
                return;
              }

              const renderFrame = async () => {
                if (
                  !isMounted ||
                  !video ||
                  !video.videoWidth ||
                  !video.videoHeight
                ) {
                  animationFrameIdRef.current =
                    requestAnimationFrame(renderFrame);
                  return;
                }

                try {
                  await hands.send({ image: video });
                } catch (e) {
                  console.error("MediaPipe frame error:", e);
                }

                animationFrameIdRef.current =
                  requestAnimationFrame(renderFrame);
              };

              renderFrame();
              setLoading(false);
            }, 100);
          },
          { once: true }
        );

        setTimeout(() => {
          if (isMounted && video.readyState < 2 && !cameraError) {
            setCameraError("Video failed to load. Please try again.");
            setLoading(false);
          }
        }, 5000);
      } catch (err) {
        console.error("Init error:", err);
        setCameraError(
          `Initialization failed: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setLoading(false);
      }
    };

    initCameraAndHands();

    return () => {
      isMounted = false;
      resetSequence();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, loadMediaPipeScripts, countFingers, onPhotoCaptured, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Raise Your Hand to Capture</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {cameraError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {cameraError}
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Show 1, then 2, then 3 fingers to take a photo.
        </p>

        <div className="relative mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-64 bg-gray-100 rounded object-cover"
            style={{
              transform: "scaleX(-1)",
              width: "100%",
              height: "256px",
              display: loading && !cameraError ? "none" : "block",
            }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="absolute top-0 left-0 w-full h-64 rounded"
            style={{ transform: "scaleX(-1)" }}
          />
          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-4xl font-bold">
              {countdown}
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            Fingers: {fingerCount ?? "-"}
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Tip: Face your palm to the camera, use good lighting, and keep your
          hand 30–50 cm away.
        </p>

        <div className="flex justify-center items-center gap-2 mb-4">
          {[1, 2, 3].map((num, idx) => {
            const state = num <= currentStep ? "Filled" : "Outline";
            const fileName = `Var=${num}, State=${state}.png`;
            return (
              <div key={num} className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-400 rounded">
                  <img
                    src={`/images/${fileName}`}
                    alt={`Step ${num} ${state}`}
                    className="w-8 h-8 object-contain"
                  />
                </div>
                {idx < 2 && (
                  <img
                    src="/icons/arrow.png"
                    alt="Arrow"
                    className="w-2 h-3 mx-2"
                  />
                )}
              </div>
            );
          })}
        </div>

        {loading && !cameraError && (
          <div className="text-center text-gray-500">Starting camera...</div>
        )}

        {isCountingDown && (
          <div className="text-center text-blue-600 text-sm">
            Countdown started! You can lower your hand.
          </div>
        )}
      </div>
    </div>
  );
}
