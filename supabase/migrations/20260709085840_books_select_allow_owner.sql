-- 修正建立帳本失敗問題：
-- books.create() 用 insert().select() 會觸發 Prefer: return=representation，
-- PostgREST 回傳新row前會套用 select policy 檢查可見性。
-- 但當下 owner 尚未被加入 members 表（member insert 是後續步驟），
-- is_book_member() 一定回傳 false，導致剛建立的 book 無法被看見，
-- PostgREST 回傳 42501 "new row violates row-level security policy"。
-- 讓 owner 一律可見自己建立的 book，不必等 members 資料存在。
drop policy "books: select for members" on public.books;

create policy "books: select for members"
  on public.books for select
  using (public.is_book_member(id) or public.is_book_owner(id));
