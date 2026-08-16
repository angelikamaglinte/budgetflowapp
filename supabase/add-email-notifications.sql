-- Sends an email via Resend whenever a notification is created — whether
-- from the scheduled automation job or from an in-app action (like the
-- transfer checklist when you mark an invoice paid). Uses pg_net for the
-- outbound HTTP call, so no Edge Function is needed; the Resend API key is
-- read from Supabase's Vault, never stored in this file or in plain SQL.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION notify_via_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  api_key TEXT;
  user_email TEXT;
BEGIN
  SELECT decrypted_secret INTO api_key FROM vault.decrypted_secrets WHERE name = 'resend_api_key';
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;

  IF api_key IS NULL OR user_email IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'BudgetFlow <onboarding@resend.dev>',
      'to', user_email,
      'subject', 'BudgetFlow — ' || left(NEW.message, 60),
      'text', NEW.message
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_send_email ON notifications;
CREATE TRIGGER notifications_send_email
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_via_email();
