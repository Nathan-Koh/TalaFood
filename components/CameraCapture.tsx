
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Spinner from './Spinner';

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  onClose?: () => void; // Optional: if you want a close button within the component
  captureLabel: string;
  instructionText: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, captureLabel, instructionText }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial camera loading

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (stream) { // Stop existing stream before starting a new one
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please enable camera access in your browser settings.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
           setError("No camera found. Please ensure a camera is connected and enabled.");
        } else {
          setError(`Error accessing camera: ${err.message}`);
        }
      } else {
        setError("An unknown error occurred while accessing the camera.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [stream]); // Add stream to dependencies to manage re-initialization if needed

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to initialize camera

  const handleCanPlay = () => {
     setIsLoading(false); // Camera is ready
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Set canvas dimensions to video dimensions to capture full frame
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller size, 0.9 quality
        onCapture(dataUrl);
      }
    } else {
      setError("Failed to capture image. Camera not ready.");
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-neutral-light/50 rounded-lg shadow-md w-full max-w-lg mx-auto">
      <p className="text-md font-poppins text-neutral-dark mb-3 text-center">{instructionText}</p>
      <div className="relative w-full aspect-[4/3] bg-neutral-dark rounded-md overflow-hidden shadow-inner mb-4">
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <Spinner color="text-white" />
            <p className="ml-2 text-white">Starting camera...</p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted // Muted to avoid feedback loops if microphone was accidentally requested
          className={`w-full h-full object-cover ${isLoading || error ? 'hidden' : ''}`}
          onCanPlay={handleCanPlay}
        />
         {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-red-100 text-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-center font-medium">{error}</p>
            <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm"
            >
                Try Again
            </button>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
      {!error && !isLoading && (
        <button
          onClick={handleCapture}
          disabled={!stream}
          className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-50 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2-2a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1H4z" />
            <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" />
            <path d="M10 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
          <span>{captureLabel}</span>
        </button>
      )}
      {onClose && (
         <button
          onClick={onClose}
          className="mt-3 text-sm text-neutral hover:text-neutral-dark"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default CameraCapture;
