-- 修正：books.custom_categories 沒有預設值時是 null，
-- 但前端全部假設它是 array（例如 category-picker-dialog.tsx 做 [...customCategories]），
-- 剛建立的帳本一進入詳情頁就會因為 spread null 而 crash。
-- 補上預設值、backfill 既有 null 資料，並鎖 not null 從根本保證這個欄位永遠是 array。
update public.books set custom_categories = '[]'::jsonb where custom_categories is null;

alter table public.books
  alter column custom_categories set default '[]'::jsonb,
  alter column custom_categories set not null;
