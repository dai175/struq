// Written as a string (not a module) because virtual:pwa-register doesn't
// resolve in TanStack Start's SSR build — the React document needs registration
// inline rather than imported.
export const SERVICE_WORKER_REGISTER_SCRIPT = `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})});}`;
