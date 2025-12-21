import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import config from '../config.json';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [me, setMe] = useState('');
    const [stats, setStats] = useState({
        totalUsers: 0,
        videoUsers: 0,
        audioUsers: 0,
        textUsers: 0
    });

    // Use a ref to prevent multiple connection attempts
    const socketRef = useRef(null);

    useEffect(() => {
        // 1. Get or Generate Device ID
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem('deviceId', deviceId);
        }

        // 2. Connect
        // Replace with your actual backend URL in production
        const BACKEND_URL = config.BACKEND_URL;

        if (!socketRef.current) {
            socketRef.current = io(BACKEND_URL, {
                query: { deviceId },
                // Transports fallback is robust for some networks
                transports: ['websocket', 'polling']
            });

            socketRef.current.on('connect', () => {
                console.log('Connected to socket server');
                setIsConnected(true);
            });

            socketRef.current.on('me', (id) => {
                setMe(id);
            });

            socketRef.current.on('stats-update', (newStats) => {
                setStats(newStats);
            });

            socketRef.current.on('disconnect', () => {
                console.log('Disconnected from socket server');
                setIsConnected(false);
            });

            setSocket(socketRef.current);
        }

        // Cleanup
        return () => {
            // In a SPA, we might want to keep the socket alive, but strictly:
            // socketRef.current.disconnect(); 
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, me, stats }}>
            {children}
        </SocketContext.Provider>
    );
};
