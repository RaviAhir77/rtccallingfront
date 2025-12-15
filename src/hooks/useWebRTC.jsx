import { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '../providers/SocketProvider';
import useToast from './useToast';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

const useWebRTC = (partnerId, isInitiator, localStream) => {
    const { socket } = useSocket();
    const { toast } = useToast();

    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] = useState('new');

    const peerRef = useRef(null);
    const pendingOfferRef = useRef(null); // Ref to store offer if peer/media isn't ready

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
            console.log("Connection state for partner " + partnerId + ":", peer.connectionState);
            setConnectionState(peer.connectionState);
        };

        peerRef.current = peer;
        return peer;
    }, [partnerId, socket]);

    // Manage Connection and Tracks
    useEffect(() => {
        const cleanup = () => {
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }
            setRemoteStream(null);
            pendingOfferRef.current = null;
        };

        if (!partnerId || !localStream) {
            cleanup();
            return;
        }

        const setupConnection = async () => {
            // 1. Create Peer synchronously
            const peer = createPeer();

            // 2. Add Tracks from current Local Stream
            localStream.getTracks().forEach(track => {
                try {
                    // Check if track already added?
                    // peer.addTrack throws if duplicate? No, but let's be safe or just add
                    // In a fresh peer, we just add.
                    peer.addTrack(track, localStream);
                } catch (e) {
                    console.warn("Track addition warning:", e);
                }
            });

            // 3. Handle Pending Offer (Receiver)
            if (pendingOfferRef.current && !isInitiator) {
                console.log("Processing pending offer with media ready...");
                const { sdp, caller } = pendingOfferRef.current;
                try {
                    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);
                    socket.emit('answer', { target: caller, sdp: peer.localDescription });
                    pendingOfferRef.current = null;
                } catch (e) {
                    console.error("Error handling pending offer:", e);
                }
            }
            // 4. Create Offer (Initiator)
            else if (isInitiator) {
                console.log("Creating offer...");
                try {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit('offer', { target: partnerId, sdp: peer.localDescription });
                } catch (e) {
                    console.error("Error creating offer:", e);
                }
            }
        };

        setupConnection();

        return cleanup;
    }, [partnerId, isInitiator, localStream, createPeer, socket]);

    // Handle Signaling Events
    useEffect(() => {
        if (!socket) return;

        const handleOffer = async ({ sdp, caller }) => {
            if (!isInitiator) { // Only receiver handles offer
                const peer = peerRef.current;

                if (peer && localStream) {
                    console.log("Handling offer immediately");
                    try {
                        // Ensure we aren't in a bad state?
                        if (peer.signalingState !== "stable") {
                            // Collision or renegotiation? For simple app, maybe ignore or reset?
                            // usually "have-local-offer" means we started too?
                        }
                        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
                        const answer = await peer.createAnswer();
                        await peer.setLocalDescription(answer);
                        socket.emit('answer', { target: caller, sdp: peer.localDescription });
                    } catch (e) {
                        console.error("Error handling offer:", e);
                    }
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
                    try {
                        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
                    } catch (e) {
                        console.error("Error handling answer:", e);
                    }
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
    }, [socket, isInitiator, partnerId, localStream]);

    return { remoteStream, connectionState };
};

export default useWebRTC;
