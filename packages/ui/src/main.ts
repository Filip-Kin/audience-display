import './app.css'
import App from './App.svelte'

// The display is a direct-loaded kiosk URL: mark it synchronously (before first
// paint) so the fixed 1920x1080 scaled canvas applies with no flash. SPA
// navigation to/from /display is handled by ScreenRouter's mount/destroy.
if (window.location.pathname.replace(/\/+$/, "") === "/display") {
  document.documentElement.classList.add("kiosk")
}

const app = new App({
  target: document.getElementById('app')!,
})

export default app
