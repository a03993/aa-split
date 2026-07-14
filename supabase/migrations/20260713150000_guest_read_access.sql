-- 開放已登入使用者唯讀瀏覽帳本（分享連結 = 邀請），寫入權限維持不變（仍綁 is_book_member/is_book_owner）。
-- 同時補上 create/update_expense_with_category 這兩支 security definer RPC 原本缺漏的 member 檢查，
-- 避免拿到連結、已登入但非成員的訪客繞過 UI 直接寫入。

drop policy "books: select for members" on public.books;
create policy "books: select for authenticated users"
  on public.books for select
  using (auth.uid() is not null);

drop policy "members: select for book members" on public.members;
create policy "members: select for authenticated users"
  on public.members for select
  using (auth.uid() is not null);

drop policy "expenses: select for book members" on public.expenses;
create policy "expenses: select for authenticated users"
  on public.expenses for select
  using (auth.uid() is not null);

drop policy "expense_splits: select follows expense" on public.expense_splits;
create policy "expense_splits: select for authenticated users"
  on public.expense_splits for select
  using (
    auth.uid() is not null
    and exists (select 1 from public.expenses e where e.id = expense_splits.expense_id)
  );

drop policy "settlements: select for book members" on public.settlements;
create policy "settlements: select for authenticated users"
  on public.settlements for select
  using (auth.uid() is not null);

create or replace function public.create_expense_with_category(
  p_book_id         uuid,
  p_title           text,
  p_category        text,
  p_amount          numeric,
  p_payer_member_id uuid,
  p_split_mode      public.split_mode,
  p_date            date,
  p_time            time,
  p_splits          jsonb,
  p_pending_category jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expense_id     uuid;
  v_existing       jsonb;
  v_updated_at     timestamptz;
  v_new_categories jsonb;
  v_split          jsonb;
begin
  if not public.is_book_member(p_book_id) then
    raise exception '你不是這個帳本的成員';
  end if;

  -- 新增費用
  insert into public.expenses (
    book_id, title, category, amount, payer_member_id, split_mode, date, time
  ) values (
    p_book_id, p_title, p_category, p_amount, p_payer_member_id, p_split_mode, p_date, p_time
  )
  returning id into v_expense_id;

  -- 新增 splits
  for v_split in select * from jsonb_array_elements(p_splits)
  loop
    insert into public.expense_splits (expense_id, member_id, amount, shares)
    values (
      v_expense_id,
      (v_split->>'memberId')::uuid,
      (v_split->>'amount')::numeric,
      case when v_split->>'shares' is not null then (v_split->>'shares')::integer else null end
    );
  end loop;

  -- 若有 pending_category，附加到 custom_categories（樂觀鎖定）
  if p_pending_category is not null then
    select custom_categories, updated_at
      into v_existing, v_updated_at
      from public.books
      where id = p_book_id;

    v_new_categories := coalesce(v_existing, '[]'::jsonb) || jsonb_build_array(p_pending_category);

    update public.books
      set custom_categories = v_new_categories
      where id = p_book_id
        and updated_at = v_updated_at;

    if not found then
      raise exception 'custom_categories 已被其他人修改，請重試';
    end if;
  end if;

  return v_expense_id;
end;
$$;

create or replace function public.update_expense_with_category(
  p_expense_id      uuid,
  p_book_id         uuid,
  p_title           text,
  p_category        text,
  p_amount          numeric,
  p_payer_member_id uuid,
  p_split_mode      public.split_mode,
  p_date            date,
  p_time            time,
  p_splits          jsonb,
  p_pending_category jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing       jsonb;
  v_updated_at     timestamptz;
  v_new_categories jsonb;
  v_split          jsonb;
begin
  if not public.is_book_member(p_book_id) then
    raise exception '你不是這個帳本的成員';
  end if;

  -- 更新費用
  update public.expenses
    set title           = p_title,
        category        = p_category,
        amount          = p_amount,
        payer_member_id = p_payer_member_id,
        split_mode      = p_split_mode,
        date            = p_date,
        time            = p_time
    where id = p_expense_id;

  -- 刪除舊 splits，重新插入新 splits
  delete from public.expense_splits where expense_id = p_expense_id;

  for v_split in select * from jsonb_array_elements(p_splits)
  loop
    insert into public.expense_splits (expense_id, member_id, amount, shares)
    values (
      p_expense_id,
      (v_split->>'memberId')::uuid,
      (v_split->>'amount')::numeric,
      case when v_split->>'shares' is not null then (v_split->>'shares')::integer else null end
    );
  end loop;

  -- 若有 pending_category，附加到 custom_categories（樂觀鎖定）
  if p_pending_category is not null then
    select custom_categories, updated_at
      into v_existing, v_updated_at
      from public.books
      where id = p_book_id;

    v_new_categories := coalesce(v_existing, '[]'::jsonb) || jsonb_build_array(p_pending_category);

    update public.books
      set custom_categories = v_new_categories
      where id = p_book_id
        and updated_at = v_updated_at;

    if not found then
      raise exception 'custom_categories 已被其他人修改，請重試';
    end if;
  end if;
end;
$$;
