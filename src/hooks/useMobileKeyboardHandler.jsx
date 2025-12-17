import { useState, useEffect } from 'react';

const useMobileKeyboardHandler = () => {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const viewportHeight = window.innerHeight;
            const documentHeight = document.documentElement.clientHeight;

            // If viewport is significantly smaller than document, keyboard is likely open
            const keyboardHeight = Math.max(0, documentHeight - viewportHeight);

            setKeyboardHeight(keyboardHeight);
            setIsKeyboardVisible(keyboardHeight > 100); // Keyboard is usually > 100px
        };

        // Modern approach using Visual Viewport API (more accurate)
        const handleVisualViewportChange = () => {
            if (window.visualViewport) {
                const keyboardHeight = window.innerHeight - window.visualViewport.height;
                setKeyboardHeight(keyboardHeight);
                setIsKeyboardVisible(keyboardHeight > 100);
            }
        };

        // Fallback for browsers without visualViewport
        window.addEventListener('resize', handleResize);

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleVisualViewportChange);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
            }
        };
    }, []);

    return { keyboardHeight, isKeyboardVisible };
};

export default useMobileKeyboardHandler;