
-- 1. Fix contracts UPDATE policy: add WITH CHECK to prevent ownership transfer
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
CREATE POLICY "Users can update own contracts"
ON public.contracts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Fix sinistres UPDATE policy: add WITH CHECK
DROP POLICY IF EXISTS "Users can update own sinistres" ON public.sinistres;
CREATE POLICY "Users can update own sinistres"
ON public.sinistres
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also harden related user-scoped UPDATE policies for safety
DROP POLICY IF EXISTS "Users can update own beneficiaires" ON public.beneficiaires;
CREATE POLICY "Users can update own beneficiaires"
ON public.beneficiaires
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own passkeys" ON public.user_passkeys;
CREATE POLICY "Users update own passkeys"
ON public.user_passkeys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Block privilege escalation on user_roles: add explicit restrictive policies
-- Only admins can INSERT/UPDATE/DELETE roles. Regular users may only SELECT their own.
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Lock down has_role SECURITY DEFINER function - it's used internally by RLS only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO postgres, service_role;

-- 5. Add explicit UPDATE/DELETE policies on storage for kyc-documents
CREATE POLICY "Users update own KYC docs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = (auth.uid())::text)
WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users delete own KYC docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Admins update kyc-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete kyc-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 6. Realtime authorization: restrict topic subscription to user-scoped channels
-- Topic convention: "user:<auth.uid()>" or "admin:*" for admins
CREATE POLICY "Users subscribe to own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() = ('user:' || (auth.uid())::text))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users broadcast to own realtime topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() = ('user:' || (auth.uid())::text))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
