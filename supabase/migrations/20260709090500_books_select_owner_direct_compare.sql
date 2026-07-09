-- 上一版修法（is_book_owner(id) or ...）仍失敗：
-- is_book_owner() 內部對 books 表下 subquery，在自己 INSERT ... RETURNING
-- 的同一個命令中，subquery 看不到「正在插入中」的這一列（MVCC可見性），
-- 導致 is_book_owner() 一樣評估成 false。
-- 改成直接比對這一列自己的 owner_id 欄位，不透過 subquery，避免此問題。
drop policy "books: select for members" on public.books;

create policy "books: select for members"
  on public.books for select
  using (public.is_book_member(id) or owner_id = auth.uid());
