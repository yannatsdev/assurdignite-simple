// Validation gate for the streamlined 3-step subscription flow.
// Step 0 = Simulation, 1 = Informations & Bénéficiaires, 2 = Signature & Paiement.

export interface AdhesionState {
  kyc: { nom?: string; prenom?: string; dob?: string; phone?: string; adresse?: string; cni?: string };
  beneficiaires: Array<{ nom?: string }>;
  kycFiles?: { cni?: string; photo?: string; domicile?: string } & Record<string, any>;
  paymentDone: boolean;
  cgAccepted: boolean;
  cpAccepted: boolean;
  hasSignature: boolean;
  simResult: unknown;
}

export interface ValidationResult {
  ok: boolean;
  missing: Array<{ label: string; step: number }>;
  firstStep: number | null;
}

export function validateBeforeFinalize(s: AdhesionState): ValidationResult {
  const missing: ValidationResult['missing'] = [];

  if (!s.simResult) missing.push({ label: 'Compléter la simulation', step: 0 });
  if (!s.kyc?.nom || !s.kyc?.prenom || !s.kyc?.dob) {
    missing.push({ label: 'Renseigner identité (nom, prénom, date de naissance)', step: 1 });
  }
  const hasKycEvidence = Boolean(s.kycFiles?.cni || s.kycFiles?.photo || s.kycFiles?.domicile || s.kyc?.cni);
  if (!hasKycEvidence) {
    missing.push({ label: "Ajouter une preuve d'identité (scan CNI ou n° de pièce)", step: 1 });
  }
  if (!s.beneficiaires || s.beneficiaires.length === 0) {
    missing.push({ label: 'Désigner au moins un bénéficiaire', step: 1 });
  }
  if (!s.cgAccepted) missing.push({ label: 'Accepter les conditions générales', step: 2 });
  if (!s.paymentDone) missing.push({ label: 'Effectuer le paiement', step: 2 });
  if (!s.hasSignature) missing.push({ label: 'Signer le contrat', step: 2 });

  return {
    ok: missing.length === 0,
    missing,
    firstStep: missing.length ? missing[0].step : null,
  };
}
