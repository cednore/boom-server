import * as slug from 'slug';


/**
 * Determine if server is running in dev mode.
 *
 * @returns {boolean} Devmode?
 */
export function isdm(): boolean {
    return 'true' == process.env.DEVMODE;
}

/**
 * Get URL-friendly safe socket.io event name.
 *
 * @param {string} event Event name
 * @returns {string} Safe event name
 */
export function safe_ioeventname(event: string): string {
    return slug(event);
}

/**
 * Get URL-friendly safe socket.io event name.
 *
 * Synonym of `safe_ioeventname`.
 *
 * @param {string} event Event name
 * @returns {string} Safe event name
 */
export function ioevn(event: string): string {
    return safe_ioeventname(event);
}

/**
 * Get URL-friendly safe socket.io namespace name.
 *
 * @param {string} nsp Namespace name
 * @returns {string} Safe namespace name
 */
export function safe_ionspname(nsp: string): string {
    return slug(nsp);
}

/**
 * Get URL-friendly safe socket.io namespace name.
 *
 * Synonym of `safe_ionspname`.
 *
 * @param {string} nsp Namespace name
 * @returns {string} Safe namespace name
 */
export function ionsp(nsp: string): string {
    return safe_ionspname(nsp);
}
