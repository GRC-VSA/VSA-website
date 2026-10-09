import { API_BASE_URL } from "./config.js";
import { getTokenforAuthHeader } from "./authHeaders.js";

/*
    API calls for availability sheets.

    - Officer calls (/api/availability/...) send the JWT like the rest of the officer pages.
    - Guest calls (/api/availability/invite/{token}/...) need no login. A guest's own entry is
      identified by the edit token in the "X-Edit-Token" header.
    - Slot times are ISO instant strings from the backend (grid.slotStarts). Send them back
      exactly as received; never build them in the browser.
*/

const BASE_URL = `${API_BASE_URL}/api/availability`;
const EDIT_TOKEN_HEADER = "X-Edit-Token";

/** Error with the backend's HTTP status, so pages can tell 404/409/403 apart. */
export class AvailabilityApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "AvailabilityApiError";
        this.status = status;
    }
}

async function request(url, { method = "GET", body, headers = {} } = {}, fallbackMessage) {
    const response = await fetch(url, {
        method,
        headers: {
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            ...headers,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
        let message = fallbackMessage;
        try {
            const data = await response.json();
            if (data && data.message) message = data.message;
        } catch {
            // body was empty or not JSON; keep the fallback message
        }
        throw new AvailabilityApiError(message, response.status);
    }

    if (response.status === 204) return null;
    return response.json();
}

const officer = (extra = {}) => ({ ...getTokenforAuthHeader(), ...extra });

// ── Officer: sheets ──────────────────────────────────────────

export function listSheets() {
    return request(`${BASE_URL}/sheets`, { headers: officer() }, "Could not load availability sheets.");
}

export function getSheet(sheetId) {
    return request(`${BASE_URL}/sheets/${sheetId}`, { headers: officer() }, "Could not load this sheet.");
}

export function createSheet(sheet) {
    return request(
        `${BASE_URL}/sheets`,
        { method: "POST", body: sheet, headers: officer() },
        "Could not create the sheet."
    );
}

export function closeSheet(sheetId) {
    return request(
        `${BASE_URL}/sheets/${sheetId}/close`,
        { method: "POST", headers: officer() },
        "Could not close the sheet."
    );
}

export function reopenSheet(sheetId) {
    return request(
        `${BASE_URL}/sheets/${sheetId}/reopen`,
        { method: "POST", headers: officer() },
        "Could not reopen the sheet."
    );
}

export function deleteSheet(sheetId) {
    return request(
        `${BASE_URL}/sheets/${sheetId}`,
        { method: "DELETE", headers: officer() },
        "Could not delete the sheet."
    );
}

// ── Officer: own entry ───────────────────────────────────────

/** Replaces the whole selection. Returns the refreshed sheet, heatmap included. */
export function saveMyEntry(sheetId, slots, note) {
    return request(
        `${BASE_URL}/sheets/${sheetId}/my-entry`,
        { method: "PUT", body: { slots, note }, headers: officer() },
        "Could not save your availability."
    );
}

export function deleteMyEntry(sheetId) {
    return request(
        `${BASE_URL}/sheets/${sheetId}/my-entry`,
        { method: "DELETE", headers: officer() },
        "Could not remove your response."
    );
}

export function removeEntry(participantId) {
    return request(
        `${BASE_URL}/entries/${participantId}`,
        { method: "DELETE", headers: officer() },
        "Could not remove this response."
    );
}

// ── Officer: invite links ────────────────────────────────────

export function listInvites(sheetId) {
    return request(`${BASE_URL}/sheets/${sheetId}/invites`, { headers: officer() }, "Could not load links.");
}

export function createInvite(sheetId, { label, expiresAt, maxUses } = {}) {
    return request(
        `${BASE_URL}/sheets/${sheetId}/invites`,
        { method: "POST", body: { label, expiresAt, maxUses }, headers: officer() },
        "Could not create the link."
    );
}

export function revokeInvite(inviteId) {
    return request(
        `${BASE_URL}/invites/${inviteId}/revoke`,
        { method: "POST", headers: officer() },
        "Could not turn off the link."
    );
}

/** The page outsiders open. Must match the route in App.jsx and the backend's editPath. */
export function inviteUrl(token) {
    return `${window.location.origin}/availability/invite/${token}`;
}

// ── Guests (no login) ────────────────────────────────────────

const guestUrl = (token, path = "") => `${BASE_URL}/invite/${encodeURIComponent(token)}${path}`;
const editHeader = (editToken) => (editToken ? { [EDIT_TOKEN_HEADER]: editToken } : {});

export function getGuestSheet(token, editToken) {
    return request(guestUrl(token), { headers: editHeader(editToken) }, "Could not load this sheet.");
}

/** Returns { editToken, view }. Keep editToken: it is the only way back into the entry. */
export function submitGuestEntry(token, { name, email, slots, note }) {
    return request(
        guestUrl(token, "/entry"),
        { method: "POST", body: { name, email, slots, note } },
        "Could not save your availability."
    );
}

export function updateGuestEntry(token, editToken, { name, slots, note }) {
    return request(
        guestUrl(token, "/entry"),
        { method: "PUT", body: { name, slots, note }, headers: editHeader(editToken) },
        "Could not save your availability."
    );
}

export function withdrawGuestEntry(token, editToken) {
    return request(
        guestUrl(token, "/entry"),
        { method: "DELETE", headers: editHeader(editToken) },
        "Could not remove your response."
    );
}

export function recoverGuestLink(token, email) {
    return request(
        guestUrl(token, "/recover"),
        { method: "POST", body: { email } },
        "Could not send the link."
    );
}
