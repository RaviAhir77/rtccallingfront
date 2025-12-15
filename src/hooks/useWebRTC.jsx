import { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '../providers/SocketProvider';
import useToast from './useToast';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

const useWebRTC = (partnerId, isInitiator, isVideo = true) => {
    const { socket } = useSocket();
    const { toast } = useToast();

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] = useState('new');
    const [mediaError, setMediaError] = useState(null);

    const peerRef = useRef(null);
    const streamRef = useRef(null); // Ref for cleanup
    const pendingOfferRef = useRef(null); // Ref to store offer if media isn't ready

    // Initialize Peer Connection
    const createPeer = useCallback(() => {
        if (peerRef.current) return peerRef.current;

        const peer = new RTCPeerConnection(ICE_SERVERS);

        peer.onicecandidate = (event) => {
            if (event.candidate && partnerId) {
                socket.emit('ice-candidate', {
                    target: partnerId,
                    candidate: event.candidate
                });
            }
        };

        peer.ontrack = (event) => {
            console.log("Remote track received:", event.streams[0]);
            setRemoteStream(event.streams[0]);
        };

        peer.onconnectionstatechange = () => {
            console.log("Connection state:", peer.connectionState);
            setConnectionState(peer.connectionState);
        };

        peerRef.current = peer;
        return peer;
    }, [partnerId, socket]);

    const startCall = useCallback(async () => {
        setMediaError(null);

        // Check for Secure Context (HTTPS or localhost)
        if (!window.isSecureContext) {
            const errorMsg = "Application is not running in a Secure Context (HTTPS). Camera/Mic access is likely blocked by the browser on this network.";
            console.error(errorMsg);
            setMediaError(errorMsg);
            toast({ title: "Security Error", description: "App must be on HTTPS for mobile camera access.", variant: "destructive", duration: 6000 });
            return;
        }

        // Check availability
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const errorMsg = "navigator.mediaDevices is undefined. This browser does not support WebRTC or is blocking it (likely due to insecure HTTP).";
            console.error(errorMsg);
            setMediaError(errorMsg);
            toast({ title: "Browser Incompatible", description: "Camera API not available.", variant: "destructive" });
            return;
        }

        // 1. Create Peer synchronously so it's ready for events
        const peer = createPeer();

        try {
            // 2. Get Media
            console.log("Requesting user media...");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });

            console.log("Media stream acquired:", stream.id);
            streamRef.current = stream;
            setLocalStream(stream);

            // 3. Add Tracks
            stream.getTracks().forEach(track => {
                // Check if sender already exists (unlikely in new peer, but good practice)
                // peer.addTrack(track, stream);
                // Standard:
                peer.addTrack(track, stream);
            });

            // 4. Handle Pending Offer (for Receiver)
            if (pendingOfferRef.current && !isInitiator) {
                console.log("Processing pending offer...");
                const { sdp, caller } = pendingOfferRef.current;
                await peer.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit('answer', { target: caller, sdp: peer.localDescription });
                pendingOfferRef.current = null;
            }
            // 5. Create Offer (for Initiator)
            else if (isInitiator) {
                console.log("Creating offer...");
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socket.emit('offer', { target: partnerId, sdp: peer.localDescription });
            }

        } catch (err) {
            console.error("Error accessing media devices:", err);
            let userMsg = `Could not start media: ${err.message}`;
            if (err.name === 'NotAllowedError') {
                userMsg = "Permission Denied. Please allow access to camera and microphone.";
                toast({ title: "Permission Denied", description: "Please allow access to camera and microphone.", variant: "destructive" });
            } else if (err.name === 'NotFoundError') {
                userMsg = "No camera or microphone found in this device.";
                toast({ title: "No Device Found", description: "No camera or microphone found.", variant: "destructive" });
            } else if (err.name === 'NotReadableError' || err.message?.includes('Starting videoinput failed')) {
                userMsg = "Hardware Error. Camera/Mic is being used by another app.";
                toast({ title: "Hardware Error", description: "Camera/Mic is being used by another app.", variant: "destructive" });
            } else {
                toast({ title: "Error", description: userMsg, variant: "destructive" });
            }
            setMediaError(userMsg);
        }
    }, [createPeer, isInitiator, isVideo, partnerId, socket, toast]);

    // Start Media & Connection
    useEffect(() => {
        // Cleanup function to stop streams
        const cleanup = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }
            setLocalStream(null);
            setRemoteStream(null);
            pendingOfferRef.current = null;
            setMediaError(null);
        };

        if (!partnerId) {
            cleanup();
            return;
        }

        startCall();

        return cleanup;
    }, [partnerId, startCall]);

    // Handle Signaling Events
    useEffect(() => {
        if (!socket) return;

        const handleOffer = async ({ sdp, caller }) => {
            if (!isInitiator) { // Only receiver handles offer
                const peer = peerRef.current;

                // If peer is not ready or media not added, queue it?
                // Actually peerRef.current should be set if startCall ran synchronously part.
                // But stream might not be ready.

                if (peer && streamRef.current) {
                    console.log("Handling offer immediately");
                    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);
                    socket.emit('answer', { target: caller, sdp: peer.localDescription });
                } else {
                    console.log("Queuing offer until media is ready");
                    pendingOfferRef.current = { sdp, caller };
                }
            }
        };

        const handleAnswer = async ({ sdp }) => {
            if (isInitiator) { // Only initiator handles answer
                const peer = peerRef.current;
                if (peer) {
                    console.log("Handling answer");
                    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
                }
            }
        };

        const handleIceCandidate = async ({ candidate }) => {
            const peer = peerRef.current;
            if (peer) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding ice candidate", e);
                }
            }
        };

        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);

        return () => {
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
        };
    }, [socket, isInitiator, partnerId, startCall]); // startCall dependency is stable (useCallback)

    return { localStream, remoteStream, connectionState, mediaError, retryMedia: startCall };
};

export default useWebRTC;
