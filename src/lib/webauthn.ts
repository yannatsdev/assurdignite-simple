import { supabase } from "@/integrations/supabase/client";

export const isWebAuthnSupported = () =>
  typeof window !== "undefined" &&
  !!window.PublicKeyCredential &&
  typeof window.PublicKeyCredential === "function" &&
  typeof navigator !== "undefined" &&
  !!navigator.credentials;

export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

/**
 * Returns 'supported' | 'maybe' | 'unsupported'.
 * - supported: WebAuthn + capteur biométrique présent
 * - maybe: WebAuthn présent mais capteur non détectable (iframe, navigateur restrictif) — on tente quand même
 * - unsupported: pas de WebAuthn du tout (ex: vieux navigateur, contexte non sécurisé)
 */
export const getBiometricSupport = async (): Promise<'supported' | 'maybe' | 'unsupported'> => {
  if (!isWebAuthnSupported()) return 'unsupported';
  try {
    const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return ok ? 'supported' : 'maybe';
  } catch {
    return 'maybe';
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
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
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
    if (error) return { ok: false, error: error.message || "Service indisponible" };
    if (data && (data as any).ok === false) return { ok: false, error: (data as any).message };

    const { data: { user } } = await supabase.auth.getUser();
    if (user) localStorage.setItem(`passkey_enrolled_${user.id}`, "1");
    localStorage.setItem("passkey_device_active", "1");

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erreur" };
  }
}


export async function authenticateWithPasskey(email: string): Promise<{ ok: boolean; error?: string; code?: string; fallback?: boolean }> {
  try {
    if (!isWebAuthnSupported()) {
      return { ok: false, error: "Empreinte non disponible sur cet appareil", code: "UNSUPPORTED", fallback: true };
    }

    const { data: chData, error: chErr } = await supabase.functions.invoke("webauthn-authenticate", {
      body: { action: "challenge", email },
    });
    // Network/transport failure — treat as fallback so the UI never crashes.
    if (chErr) {
      return { ok: false, error: chErr.message || "Service indisponible", code: "NETWORK", fallback: true };
    }
    if (chData && (chData as any).ok === false) {
      return { ok: false, error: (chData as any).message, code: (chData as any).code, fallback: true };
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
        return { ok: false, error: "Authentification annulée ou expirée", code: "NotAllowedError", fallback: true };
      }
      if (name === "InvalidStateError") {
        localStorage.removeItem("passkey_device_active");
        return { ok: false, error: "Cet appareil n'est pas reconnu", code: "InvalidStateError", fallback: true };
      }
      return { ok: false, error: err?.message || "Erreur biométrique", code: name || "UNKNOWN", fallback: true };
    }

    if (!assertion) return { ok: false, error: "Annulé", code: "CANCELLED", fallback: true };

    const credentialId = bufToB64(assertion.rawId);

    const { data, error } = await supabase.functions.invoke("webauthn-authenticate", {
      body: { action: "verify", credentialId },
    });
    if (error) {
      return { ok: false, error: error.message || "Service indisponible", code: "NETWORK", fallback: true };
    }
    if (data && (data as any).ok === false) {
      return { ok: false, error: (data as any).message, code: (data as any).code, fallback: true };
    }

    const { token_hash, type } = data as { token_hash: string; type: string };
    const { error: vErr } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });
    if (vErr) return { ok: false, error: vErr.message, code: "OTP_FAILED", fallback: true };

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erreur", code: "UNKNOWN", fallback: true };
  }
}


export const hasLocalPasskey = (userId?: string) => {
  if (typeof window === "undefined") return false;
  if (userId) return localStorage.getItem(`passkey_enrolled_${userId}`) === "1";
  return localStorage.getItem("passkey_device_active") === "1";
};

/**
 * Local biometric verification for the currently signed-in user.
 * Returns:
 *  - ok: true → biométrie validée
 *  - ok: false + code 'UNSUPPORTED' → l'appareil ne supporte pas WebAuthn → l'UI doit proposer "Continuer sans biométrie"
 *  - ok: false + autre code → erreur réelle (à afficher en toast)
 */
export async function verifyBiometricForUser(
  userId: string,
  userEmail?: string | null
): Promise<{ ok: boolean; error?: string; code?: 'UNSUPPORTED' | 'CANCELLED' | 'ERROR' | 'ENROLL_FAILED' }> {
  if (!isWebAuthnSupported()) {
    return { ok: false, error: "Biométrie non disponible sur cet appareil", code: 'UNSUPPORTED' };
  }

  // Auto-enroll on the fly if needed (works whether platform check returns true or 'maybe')
  if (!hasLocalPasskey(userId)) {
    try {
      const reg = await registerPasskey("Confirmation paiement");
      if (!reg.ok) {
        const msg = reg.error || "";
        // If the actual create() call failed because no authenticator exists → unsupported
        if (/NotSupportedError|NotAllowedError|not.*available|introuvable/i.test(msg)) {
          return { ok: false, error: "Biométrie non disponible sur cet appareil", code: 'UNSUPPORTED' };
        }
        return { ok: false, error: msg || "Enrôlement biométrique échoué", code: 'ENROLL_FAILED' };
      }
    } catch (e: any) {
      return { ok: false, error: "Biométrie non disponible sur cet appareil", code: 'UNSUPPORTED' };
    }
  }

  if (!userEmail) return { ok: true };
  const res = await authenticateWithPasskey(userEmail);
  if (res.ok) return { ok: true };
  if (res.code === 'UNSUPPORTED' || res.code === 'NO_PASSKEY') {
    return { ok: false, error: res.error, code: 'UNSUPPORTED' };
  }
  if (res.code === 'NotAllowedError' || res.code === 'CANCELLED') {
    return { ok: false, error: res.error, code: 'CANCELLED' };
  }
  return { ok: false, error: res.error, code: 'ERROR' };
}
