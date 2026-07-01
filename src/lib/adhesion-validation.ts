// Validation gate before finalizing a subscription.
// Returns a typed result the wizard can use to either let the user finalize
// or jump back to the offending step with a clear list of missing items.

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
    missing.push({ label: 'Renseigner identité (nom, prénom, date de naissance)', step: 2 });
  }
  // KYC: accept either an uploaded doc OR a captured CNI number (OCR fills this).
  const hasKycEvidence = Boolean(
    s.kycFiles?.cni || s.kycFiles?.photo || s.kycFiles?.domicile || s.kyc?.cni
  );
  if (!hasKycEvidence) {
    missing.push({ label: "Ajouter une preuve d'identité (scan CNI ou n° de pièce)", step: 2 });
  }

  // Beneficiaries: soft — auto-defaulted to "Héritiers légaux" upstream, so
  // only flag if truly nothing is provided.
  if (!s.beneficiaires || s.beneficiaires.length === 0) {
    missing.push({ label: 'Désigner au moins un bénéficiaire', step: 5 });
  }
  if (!s.cgAccepted) missing.push({ label: 'Accepter les conditions générales', step: 10 });
  if (!s.paymentDone) missing.push({ label: 'Effectuer le paiement', step: 11 });
  if (!s.cpAccepted) missing.push({ label: 'Accepter les conditions particulières', step: 12 });
  if (!s.hasSignature) missing.push({ label: 'Signer le contrat', step: 13 });

  return {
    ok: missing.length === 0,
    missing,
    firstStep: missing.length ? missing[0].step : null,
  };
}

