-- Check counts only to avoid revealing sensitive data if any
SELECT 
  (SELECT count(*) FROM "bpm-anec-global".shops) as shop_count,
  (SELECT count(*) FROM "bpm-anec-global".products) as product_count,
  (SELECT count(*) FROM "bpm-anec-global".categories) as category_count;

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'bpm-anec-global' AND tablename IN ('shops', 'products');
