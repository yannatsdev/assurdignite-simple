import { useEffect, useRef } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'kkiapay-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        amount?: string | number;
        key?: string;
        callback?: string;
        sandbox?: string;
        data?: string;
        position?: string;
        theme?: string;
        name?: string;
        email?: string;
        phone?: string;
      }, HTMLElement>;
    }
  }
  interface Window {
    addSuccessListener?: (cb: (response: any) => void) => void;
    addFailedListener?: (cb: (response: any) => void) => void;
    openKkiapayWidget?: (opts: any) => void;
  }
}

interface Props {
  amount: number;
  publicKey?: string;
  email?: string;
  phone?: string;
  name?: string;
  onSuccess?: (resp: any) => void;
  onFailed?: (resp: any) => void;
  sandbox?: boolean;
}

export function KkiapayWidget({
  amount,
  publicKey = 'c0270ce321b4edc06e0127ac06829afd3c45f6c6',
  email,
  phone,
  name,
  onSuccess,
  onFailed,
  sandbox = true,
}: Props) {
  const successCb = useRef(onSuccess);
  const failedCb = useRef(onFailed);
  successCb.current = onSuccess;
  failedCb.current = onFailed;

  useEffect(() => {
    const onS = (resp: any) => successCb.current?.(resp);
    const onF = (resp: any) => failedCb.current?.(resp);
    if (typeof window !== 'undefined' && window.addSuccessListener) {
      window.addSuccessListener(onS);
      window.addFailedListener?.(onF);
    }
  }, []);

  return (
    <kkiapay-widget
      amount={String(amount)}
      key={publicKey}
      sandbox={sandbox ? 'true' : 'false'}
      data={JSON.stringify({ name, email, phone })}
      theme="#4A0E78"
      position="center"
      name={name}
      email={email}
      phone={phone}
    />
  );
}
