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

export async function authenticateWithPasskey(email: string): Promise<{ ok: boolean; error?: string; code?: string }> {
  try {
    if (!isWebAuthnSupported()) return { ok: false, error: "Non supporté", code: "UNSUPPORTED" };

    const { data: chData, error: chErr } = await supabase.functions.invoke("webauthn-authenticate", {
      body: { action: "challenge", email },
    });
    if (chErr || !chData || (chData as any).error) {
      const msg = chErr?.message || (chData as any)?.error || "";
      const code = /Aucune empreinte/i.test(msg) ? "NO_PASSKEY" : "CHALLENGE_FAILED";
      return { ok: false, error: msg || "Aucune empreinte enregistrée", code };
    }

    const allowCredentials = ((chData as any).allowCredentials || []).map((c: any) => ({
      id: b64ToBuf(c.id),
      type: "public-key" as const,
    }));

    let assertion: PublicKeyCredential | null = null;
    try {
      assertion = await navigator.credentials.get({
        publicKey: {
          challenge: b64ToBuf((chData as any).challenge),
          allowCredentials,
          userVerification: "required",
          timeout: 60000,
          rpId: window.location.hostname,
        },
      }) as PublicKeyCredential | null;
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError") {
        return { ok: false, error: "Authentification annulée ou expirée", code: "NotAllowedError" };
      }
      if (name === "InvalidStateError") {
        // Device not enrolled — clear local marker
        localStorage.removeItem("passkey_device_active");
        return { ok: false, error: "Cet appareil n'est pas reconnu", code: "InvalidStateError" };
      }
      throw err;
    }

    if (!assertion) return { ok: false, error: "Annulé", code: "CANCELLED" };

    const credentialId = bufToB64(assertion.rawId);

    const { data, error } = await supabase.functions.invoke("webauthn-authenticate", {
      body: { action: "verify", credentialId },
    });
    if (error || (data as any)?.error) {
      const msg = error?.message || (data as any)?.error || "";
      const code = /non reconnue/i.test(msg) ? "UNKNOWN_DEVICE" : "VERIFY_FAILED";
      return { ok: false, error: msg, code };
    }

    const { token_hash, type } = data as { token_hash: string; type: string };
    const { error: vErr } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });
    if (vErr) return { ok: false, error: vErr.message, code: "OTP_FAILED" };

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erreur", code: "UNKNOWN" };
  }
}

export const hasLocalPasskey = (userId?: string) => {
  if (typeof window === "undefined") return false;
  if (userId) return localStorage.getItem(`passkey_enrolled_${userId}`) === "1";
  return localStorage.getItem("passkey_device_active") === "1";
};

/**
 * Local biometric verification for the currently signed-in user.
 * Used as 2nd-factor confirmation (e.g. before signing a contract / paying).
 * Auto-enrolls the user if they don't yet have a passkey on this device.
 */
export async function verifyBiometricForUser(userId: string, userEmail?: string | null): Promise<{ ok: boolean; error?: string }> {
  if (!isWebAuthnSupported()) return { ok: false, error: "Biométrie non disponible sur cet appareil" };
  const platformOk = await isPlatformAuthenticatorAvailable();
  if (!platformOk) return { ok: false, error: "Capteur biométrique introuvable" };

  // Auto-enroll on the fly if needed
  if (!hasLocalPasskey(userId)) {
    const reg = await registerPasskey("Confirmation paiement");
    if (!reg.ok) return { ok: false, error: reg.error || "Enrôlement biométrique échoué" };
  }

  if (!userEmail) return { ok: true }; // Already enrolled this session = trusted
  const res = await authenticateWithPasskey(userEmail);
  return { ok: res.ok, error: res.error };
}
