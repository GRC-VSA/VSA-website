import '@testing-library/jest-dom';

// Polyfill localStorage in case jsdom environment doesn't attach it automatically
if (typeof window !== 'undefined' && !window.localStorage) {
    const localStorageMock = (() => {
        let store = {};
        return {
            getItem: (key) => store[key] || null,
            setItem: (key, value) => {
                store[key] = value.toString();
            },
            removeItem: (key) => {
                delete store[key];
            },
            clear: () => {
                store = {};
            },
        };
    })();

    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
    });

    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {}, // Deprecated
            removeListener: () => {}, // Deprecated
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }),
    });
}