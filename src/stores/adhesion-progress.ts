// Tiny pub/sub store for unified adhesion progress (OCR, KYC, validation).
// Plain React useSyncExternalStore — zero dependencies.
import { useSyncExternalStore } from 'react';

export type OcrPhase = 'idle' | 'compressing' | 'uploading' | 'analyzing' | 'done' | 'error';
export type KycDoc = 'cni_recto' | 'cni_verso' | 'selfie' | 'domicile';
export type KycPhase = 'idle' | 'uploading' | 'done' | 'error';

export interface AdhesionProgressState {
  /** 0..4 macro-step index (Simulation → Identité → KYC+Bénéf → Conditions+Sign+Payment → Reçu) */
  macroStep: number;
  ocr: { phase: OcrPhase; message?: string };
  kyc: Record<KycDoc, KycPhase>;
  validationMissing: string[];
}

const initial: AdhesionProgressState = {
  macroStep: 0,
  ocr: { phase: 'idle' },
  kyc: { cni_recto: 'idle', cni_verso: 'idle', selfie: 'idle', domicile: 'idle' },
  validationMissing: [],
};

let state: AdhesionProgressState = initial;
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

export const adhesionProgress = {
  get: () => state,
  set: (patch: Partial<AdhesionProgressState>) => { state = { ...state, ...patch }; emit(); },
  setMacroStep: (n: number) => { state = { ...state, macroStep: n }; emit(); },
  setOcr: (phase: OcrPhase, message?: string) => { state = { ...state, ocr: { phase, message } }; emit(); },
  setKyc: (doc: KycDoc, phase: KycPhase) => { state = { ...state, kyc: { ...state.kyc, [doc]: phase } }; emit(); },
  setMissing: (missing: string[]) => { state = { ...state, validationMissing: missing }; emit(); },
  reset: () => { state = initial; emit(); },
  subscribe: (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
};

export function useAdhesionProgress() {
  return useSyncExternalStore(adhesionProgress.subscribe, adhesionProgress.get, adhesionProgress.get);
}
