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

    const peerRef = useRef(null);

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

    // Start Media & Connection
    useEffect(() => {
        // Cleanup function to stop streams
        const cleanup = () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }
            setLocalStream(null);
            setRemoteStream(null);
        };

        if (!partnerId) {
            cleanup();
            return;
        }

        const startCall = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: isVideo,
                    audio: true
                });
                setLocalStream(stream);

                const peer = createPeer();
                stream.getTracks().forEach(track => peer.addTrack(track, stream));

                if (isInitiator) {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit('offer', { target: partnerId, sdp: peer.localDescription });
                }
            } catch (err) {
                console.error("Error accessing media devices:", err);
                if (err.name === 'NotAllowedError') {
                    toast({ title: "Permission Denied", description: "Please allow access to camera and microphone.", variant: "destructive" });
                } else if (err.name === 'NotFoundError') {
                    toast({ title: "No Device Found", description: "No camera or microphone found.", variant: "destructive" });
                } else if (err.name === 'NotReadableError' || err.message.includes('Starting videoinput failed')) {
                    toast({ title: "Hardware Error", description: "Camera/Mic is being used by another app (or browser tab).", variant: "destructive" });
                } else {
                    toast({ title: "Error", description: "Could not start media stream.", variant: "destructive" });
                }
            }
        };

        startCall();

        return cleanup;
    }, [partnerId, isInitiator, isVideo, createPeer, socket, toast]);

    // Handle Signaling Events
    useEffect(() => {
        if (!socket || !peerRef.current) return;

        const handleOffer = async ({ sdp, caller }) => {
            if (!isInitiator) { // Only receiver handles offer
                const peer = peerRef.current;
                if (!peer) return;

                await peer.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit('answer', { target: caller, sdp: peer.localDescription });
            }
        };

        const handleAnswer = async ({ sdp }) => {
            if (isInitiator) { // Only initiator handles answer
                const peer = peerRef.current;
                if (peer) {
                    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
                }
            }
        };

        const handleIceCandidate = async ({ candidate }) => {
            const peer = peerRef.current;
            if (peer) {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
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
    }, [socket, isInitiator, partnerId]);

    return { localStream, remoteStream, connectionState };
};

export default useWebRTC;
