-- Add buyer details columns to mp_purchases
ALTER TABLE mp_purchases
  ADD COLUMN IF NOT EXISTS buyer_name  TEXT,
  ADD COLUMN IF NOT EXISTS buyer_email TEXT;

-- Allow sellers to see purchases on their own listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'mp_purchases'
      AND policyname = 'mp_purchases_seller_view'
  ) THEN
    CREATE POLICY "mp_purchases_seller_view" ON mp_purchases
      FOR SELECT USING (
        listing_id IN (
          SELECT id FROM mp_listings WHERE publisher_user_id = auth.uid()
        )
      );
  END IF;
END $$;
