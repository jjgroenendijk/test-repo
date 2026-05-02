import "./styles.css";
import { renderApp } from "./app.js";

const cleanup = renderApp(document.querySelector("#app"));

// If HMR is enabled (e.g. during dev), clean up interval on reload
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (cleanup) cleanup();
  });
}
