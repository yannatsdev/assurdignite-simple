import { supabase } from "@/integrations/supabase/client";

export const isWebAuthnSupported = () =>
  typeof window !== "undefined" &&
  !!window.PublicKeyCredential &&
  typeof window.PublicKeyCredential === "function";

export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

const b64ToBuf = (b64: string): ArrayBuffer => {
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

const bufToB64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

export async function registerPasskey(deviceName?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isWebAuthnSupported()) return { ok: false, error: "Non supporté" };

    const { data: chData, error: chErr } = await supabase.functions.invoke("webauthn-register", {
      body: { action: "challenge" },
    });
    if (chErr || !chData) return { ok: false, error: chErr?.message || "Challenge error" };

    const userIdBytes = new TextEncoder().encode(chData.user.id);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: b64ToBuf(chData.challenge),
        rp: { name: chData.rp.name, id: window.location.hostname },
        user: {
          id: userIdBytes,
          name: chData.user.name,
          displayName: chData.user.displayName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: "none",
      },
    }) as PublicKeyCredential | null;

    if (!credential) return { ok: false, error: "Création annulée" };

    const response = credential.response as AuthenticatorAttestationResponse;
    const credentialId = bufToB64(credential.rawId);
    const publicKey = bufToB64(response.getPublicKey?.() || new ArrayBuffer(0));

    const { data, error } = await supabase.functions.invoke("webauthn-register", {
      body: {
        action: "verify",
        credentialId,
        publicKey,
        deviceName: deviceName || `${navigator.platform} • ${new Date().toLocaleDateString("fr-FR")}`,
      },
    });
    if (error || (data as any)?.error) return { ok: false, error: error?.message || (data as any)?.error };

    // Local marker
    const { data: { user } } = await supabase.auth.getUser();
    if (user) localStorage.setItem(`passkey_enrolled_${user.id}`, "1");
    localStorage.setItem("passkey_device_active", "1");

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erreur" };
  }
}

export async function authenticateWithPasskey(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isWebAuthnSupported()) return { ok: false, error: "Non supporté" };

    const { data: chData, error: chErr } = await supabase.functions.invoke("webauthn-authenticate", {
      body: { action: "challenge", email },
    });
    if (chErr || !chData || (chData as any).error) {
      return { ok: false, error: chErr?.message || (chData as any)?.error };
    }

    const allowCredentials = ((chData as any).allowCredentials || []).map((c: any) => ({
      id: b64ToBuf(c.id),
      type: "public-key" as const,
    }));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: b64ToBuf((chData as any).challenge),
        allowCredentials,
        userVerification: "required",
        timeout: 60000,
        rpId: window.location.hostname,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) return { ok: false, error: "Annulé" };

    const credentialId = bufToB64(assertion.rawId);

    const { data, error } = await supabase.functions.invoke("webauthn-authenticate", {
      body: { action: "verify", credentialId },
    });
    if (error || (data as any)?.error) return { ok: false, error: error?.message || (data as any)?.error };

    const { token_hash, type } = data as { token_hash: string; type: string };
    const { error: vErr } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });
    if (vErr) return { ok: false, error: vErr.message };

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erreur" };
  }
}

export const hasLocalPasskey = (userId?: string) => {
  if (typeof window === "undefined") return false;
  if (userId) return localStorage.getItem(`passkey_enrolled_${userId}`) === "1";
  return localStorage.getItem("passkey_device_active") === "1";
};
