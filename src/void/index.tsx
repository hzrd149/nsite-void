import { render } from "solid-js/web";
import "./index.css";
import Chat from "./Chat.tsx";

// Function to detect and set the system theme
function setSystemTheme(container: HTMLElement) {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  container.setAttribute("data-theme", isDark ? "dark" : "light");
}

// Function to listen for system theme changes
function setupThemeListener(container: HTMLElement) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // Update theme when system preference changes
  mediaQuery.addEventListener("change", (e) => {
    container.setAttribute("data-theme", e.matches ? "dark" : "light");
  });
}

// Create the host element
const root = document.createElement("div");
root.id = "void";
document.body.append(root);

// Create shadow DOM
const shadowRoot = root.attachShadow({ mode: "open" });

// Create a container inside the shadow DOM (initially hidden to prevent FOUC)
const shadowContainer = document.createElement("div");
shadowContainer.style.display = "none";
shadowRoot.append(shadowContainer);

// Set initial theme based on system preference
setSystemTheme(shadowContainer);

// Listen for system theme changes
setupThemeListener(shadowContainer);

// Load the CSS into the shadow DOM
const linkElement = document.createElement("link");
linkElement.rel = "stylesheet";
linkElement.href = "/void.css";
shadowRoot.append(linkElement);

// Render the Chat component inside the shadow DOM
render(() => <Chat />, shadowContainer);
