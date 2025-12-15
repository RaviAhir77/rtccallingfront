import { useState, useEffect, useRef, useCallback } from 'react';
import useToast from './useToast';

const useLocalMedia = (isVideo = true) => {
    const { toast } = useToast();
    const [localStream, setLocalStream] = useState(null);
    const [mediaError, setMediaError] = useState(null);
    const streamRef = useRef(null);

    const startMedia = useCallback(async () => {
        setMediaError(null);

        // Check for Secure Context
        if (!window.isSecureContext) {
            const errorMsg = "Application is not running in a Secure Context (HTTPS). Camera/Mic access is likely blocked.";
            console.error(errorMsg);
            setMediaError(errorMsg);
            toast({ title: "Security Error", description: "App must be on HTTPS for mobile camera access.", variant: "destructive" });
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const errorMsg = "navigator.mediaDevices is undefined. Browser incompatible.";
            console.error(errorMsg);
            setMediaError(errorMsg);
            toast({ title: "Browser Incompatible", description: "Camera API not available.", variant: "destructive" });
            return;
        }

        try {
            console.log("Requesting user media...");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });

            console.log("Media stream acquired:", stream.id);
            streamRef.current = stream;
            setLocalStream(stream);

        } catch (err) {
            console.error("Error accessing media devices:", err);
            let userMsg = `Could not start media: ${err.message}`;
            if (err.name === 'NotAllowedError') {
                userMsg = "Permission Denied. Please allow access to camera and microphone.";
                toast({ title: "Permission Denied", description: userMsg, variant: "destructive" });
            } else if (err.name === 'NotFoundError') {
                userMsg = "No camera or microphone found.";
                toast({ title: "No Device Found", description: userMsg, variant: "destructive" });
            } else if (err.name === 'NotReadableError' || err.message?.includes('Starting videoinput failed')) {
                userMsg = "Hardware Error. Camera/Mic is being used by another app.";
                toast({ title: "Hardware Error", description: userMsg, variant: "destructive" });
            } else {
                toast({ title: "Error", description: userMsg, variant: "destructive" });
            }
            setMediaError(userMsg);
        }
    }, [isVideo, toast]);

    useEffect(() => {
        startMedia();

        return () => {
            if (streamRef.current) {
                console.log("Stopping local media stream...");
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            setLocalStream(null);
        };
    }, [startMedia]);

    return { localStream, mediaError, retryMedia: startMedia };
};

export default useLocalMedia;
