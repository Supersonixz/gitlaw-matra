import { useState, useEffect, RefObject } from 'react';

export function useDebouncedWindowWidth(delay: number = 150) {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => setWidth(window.innerWidth), delay);
        };

        setWidth(window.innerWidth);

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, [delay]);

    return width;
}

export function useDebouncedElementWidth(
    ref: RefObject<HTMLElement | null>,
    delay: number = 100
) {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (!ref.current) return;
        let timeoutId: NodeJS.Timeout;

        const observer = new ResizeObserver((entries) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                for (let entry of entries) {
                    setWidth(entry.contentRect.width);
                }
            }, delay);
        });

        observer.observe(ref.current);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [ref, delay]);

    return width;
}