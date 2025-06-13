import {
  firstValueFrom,
  mergeWith,
  Observable,
  of,
  shareReplay,
  switchMap,
} from "rxjs";
import { logger } from "../../common/logger";

const log = logger.extend("service-worker");

/**
 * Check if service worker is supported
 */
export function isSupported(): boolean {
  return "serviceWorker" in navigator;
}

/** Creates an observable that emits the registration when the state changes */
function watchStateChange(
  registration: ServiceWorkerRegistration,
): Observable<ServiceWorkerRegistration> {
  return new Observable((observer) => {
    observer.next(registration);
    const handler = () => observer.next(registration);
    registration.addEventListener("statechange", handler);
    return () => registration.removeEventListener("statechange", handler);
  });
}

/** Creates an observable that emits the new registration when the controller changes */
function watchControllerChange(): Observable<ServiceWorkerContainer> {
  return new Observable((observer) => {
    const handler = () => observer.next(navigator.serviceWorker);

    // Listen for the controlling service worker changing
    navigator.serviceWorker.addEventListener("controllerchange", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("controllerchange", handler);
  });
}

/**
 * Setup service worker - returns existing registration or creates a new one
 * @returns Promise that resolves to the service worker registration
 * @throws Error if service workers are not supported or registration fails
 */
export async function setupServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isSupported())
    throw new Error("Service Workers are not supported in this browser");

  try {
    // Check if already registered
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing && existing.active) {
      log("Using existing service worker registration");
      await existing.update();
      return existing;
    }

    // Register new service worker
    log("Registering new service worker");
    const registration = await navigator.serviceWorker.register("/sw.js");
    log("Service worker registered successfully");

    return registration;
  } catch (error) {
    log("Service worker setup failed:", error);
    throw error;
  }
}

/** Create an observable that emits the service worker container when it changes */
export const container$ = of(navigator.serviceWorker).pipe(
  // Watch for new controller registrations
  mergeWith(watchControllerChange()),
  // Share the registration so it can be used by multiple subscribers
  shareReplay(1),
);

// Subject to emit registration updates - single source of truth
export const registration$ = container$.pipe(
  switchMap(setupServiceWorker),
  // Update the registration when the state changes
  switchMap(watchStateChange),
  // Share the registration so it can be used by multiple subscribers
  shareReplay(1),
);

/** Force update the service worker */
export async function updateServiceWorker(): Promise<ServiceWorkerRegistration> {
  try {
    const registration = await firstValueFrom(registration$);
    if (registration instanceof Error) throw registration;

    log("Updating service worker");
    await registration.update();
    return registration;
  } catch (error) {
    throw new Error(
      `Update failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
