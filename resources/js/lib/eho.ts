// import { configureEcho } from '@laravel/echo-react';

// export const echo = configureEcho({
//     broadcaster: 'reverb',
//     key: import.meta.env.VITE_REVERB_APP_KEY,
//     wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
//     wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
//     wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
//     forceTLS: false,
//     enabledTransports: ['ws', 'wss'],
// });
import { configureEcho } from '@laravel/echo-react';

export const echo = configureEcho({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,

    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,

    forceTLS: false,
    enabledTransports: ['ws', 'wss'],

    authEndpoint: '/broadcasting/auth',

    auth: {
        headers: {
            'X-CSRF-TOKEN': document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '',
        },
    },
});
