// graphClient.ts
import { msalInstance, loginRequest, initializeMsal } from "./authConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initializeMsal();
    initialized = true;
  }
}

async function getAccessToken(): Promise<string> {
  await ensureInitialized();

  const accounts = msalInstance.getAllAccounts();

  // If no accounts, trigger login
  if (accounts.length === 0) {
    const loginResponse = await msalInstance.loginPopup(loginRequest);
    return loginResponse.accessToken;
  }

  const account = accounts[0];

  try {
    // Try to get token silently
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    return response.accessToken;
  } catch (error) {
    // If silent acquisition fails, try interactive login
    if (error instanceof InteractionRequiredAuthError) {
      const response = await msalInstance.acquireTokenPopup(loginRequest);
      return response.accessToken;
    }
    throw error;
  }
}

export async function graphGet<T = any>(url: string): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(`https://graph.microsoft.com/v1.0${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function isSignedIn(): Promise<boolean> {
  await ensureInitialized();
  return msalInstance.getAllAccounts().length > 0;
}

export async function signOut(): Promise<void> {
  await ensureInitialized();
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    await msalInstance.logoutPopup({ account: accounts[0] });
  }
}