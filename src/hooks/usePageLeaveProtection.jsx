import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

const usePageLeaveProtection = (isActive) => {
    // 1. Browser Refresh/Close Protection
    useEffect(() => {
        if (!isActive) return;

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            // Chrome requires returnValue to be set
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isActive]);

    // 2. In-App Navigation Protection (Back button, Links)
    // useBlocker returns true to block, false to allow.
    useBlocker(
        ({ currentLocation, nextLocation }) => {
            if (isActive && currentLocation.pathname !== nextLocation.pathname) {
                // Return true (block) if user cancels the confirmation
                return !window.confirm("You have an active call. Are you sure you want to leave? This will disconnect you.");
            }
            return false;
        }
    );
};

export default usePageLeaveProtection;
