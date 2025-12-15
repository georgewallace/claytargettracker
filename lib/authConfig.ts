// authConfig.ts
import { PublicClientApplication, Configuration } from "@azure/msal-browser";

// MSAL configuration
const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || "common"}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : "",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

// Create the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Login request configuration
export const loginRequest = {
  scopes: [
    "User.Read",
    "Files.Read",
    "Files.Read.All"
  ],
};

// Initialize MSAL
export async function initializeMsal() {
  try {
    await msalInstance.initialize();
    await msalInstance.handleRedirectPromise();
  } catch (error) {
    console.error("MSAL initialization error:", error);
  }
}
