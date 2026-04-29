import { vi } from 'vitest';

export function createBrowserMock() {
    return {
        tabs: {
            onUpdated: { addListener: vi.fn() },
            update: vi.fn().mockResolvedValue({}),
            get: vi.fn().mockResolvedValue({ url: '' }),
            query: vi.fn().mockResolvedValue([]),
        },
        storage: {
            sync: {
                get: vi.fn().mockResolvedValue({}),
                set: vi.fn().mockResolvedValue(undefined),
            },
            onChanged: { addListener: vi.fn() },
        },
        runtime: {
            getURL: vi.fn((path) => `chrome-extension://fake-id/${path}`),
            sendMessage: vi.fn().mockResolvedValue([]),
            onMessage: { addListener: vi.fn() },
            getBrowserInfo: undefined,
        },
        action: {
            setTitle: vi.fn(),
        },
        i18n: {
            getMessage: vi.fn((key) => key),
        },
    };
}
