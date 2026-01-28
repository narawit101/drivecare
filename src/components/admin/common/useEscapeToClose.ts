import { useEffect, useRef } from "react";

export function useEscapeToClose(enabled: boolean, onEscape: () => void) {
    const onEscapeRef = useRef(onEscape);

    useEffect(() => {
        onEscapeRef.current = onEscape;
    }, [onEscape]);

    useEffect(() => {
        if (!enabled) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            onEscapeRef.current();
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [enabled]);
}
