create type public.split_mode as enum ('equal', 'custom');

create table public.profiles (
  id           uuid        primary key references auth.users (id) on delete cascade,
  line_user_id text        unique,
  display_name text        not null,
  avatar_url   text        not null default '',
  created_at   timestamptz not null default now()
);

create table public.books (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  owner_id          uuid        not null references public.profiles (id) on delete restrict,
  settled_at        timestamptz,
  custom_categories jsonb,
  currency          text        not null default 'TWD',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.members (
  id           uuid        primary key default gen_random_uuid(),
  book_id      uuid        not null references public.books (id) on delete cascade,
  display_name text        not null,
  profile_id   uuid        references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint members_book_display_name_unique unique (book_id, display_name)
);

create table public.expenses (
  id              uuid              primary key default gen_random_uuid(),
  book_id         uuid              not null references public.books (id) on delete cascade,
  title           text              not null,
  category        text              not null default 'food',
  amount          numeric(12,2)     not null check (amount > 0),
  payer_member_id uuid              not null references public.members (id) on delete restrict,
  split_mode      public.split_mode not null,
  date            date              not null,
  time            time         not null,
  created_at      timestamptz       not null default now(),
  updated_at      timestamptz       not null default now()
);

create table public.expense_splits (
  id         uuid          primary key default gen_random_uuid(),
  expense_id uuid          not null references public.expenses (id) on delete cascade,
  member_id  uuid          not null references public.members (id) on delete restrict,
  amount     numeric(12,2) not null check (amount >= 0),
  shares     integer       null check (shares is null or shares > 0),
  created_at timestamptz   not null default now(),
  constraint expense_splits_expense_member_unique unique (expense_id, member_id)
);

create table public.settlements (
  id                   uuid          primary key default gen_random_uuid(),
  book_id              uuid          not null references public.books (id) on delete cascade,
  payer_member_id      uuid          not null references public.members (id) on delete restrict,
  receiver_member_id   uuid          not null references public.members (id) on delete restrict,
  amount               numeric(12,2) not null check (amount > 0),
  -- 結算時可選填的換算資訊，僅供顯示參考，實際欠款金額（amount）仍以 books.currency 為準
  settlement_currency  text          null,
  exchange_rate        numeric(18,6) null check (exchange_rate is null or exchange_rate > 0),
  created_at           timestamptz   not null default now(),
  constraint settlements_payer_receiver_different check (payer_member_id <> receiver_member_id)
);

create index idx_profiles_line_user_id on public.profiles (line_user_id) where line_user_id is not null;

create index idx_books_owner_id   on public.books (owner_id);
create index idx_books_created_at on public.books (created_at desc);

create index idx_members_book_id on public.members (book_id);
create index idx_members_profile_id on public.members (profile_id) where profile_id is not null;

create index idx_expenses_book_id         on public.expenses (book_id);
create index idx_expenses_payer_member_id on public.expenses (payer_member_id);
create index idx_expenses_book_date       on public.expenses (book_id, date desc);

create index idx_expense_splits_expense_id on public.expense_splits (expense_id);
create index idx_expense_splits_member_id  on public.expense_splits (member_id);

create index idx_settlements_book_id            on public.settlements (book_id);
create index idx_settlements_payer_member_id    on public.settlements (payer_member_id);
create index idx_settlements_receiver_member_id on public.settlements (receiver_member_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

create or replace function public.is_book_member(book_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members m
    where m.book_id = is_book_member.book_id
      and m.profile_id = auth.uid()
  );
$$;

create or replace function public.is_book_owner(book_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.books b
    where b.id = is_book_owner.book_id
      and b.owner_id = auth.uid()
  );
$$;

alter table public.profiles       enable row level security;
alter table public.books          enable row level security;
alter table public.members        enable row level security;
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements    enable row level security;

create policy "profiles: select own row"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: insert own row"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles: update own row"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "books: select for members"
  on public.books for select
  using (public.is_book_member(id));

create policy "books: insert by authenticated user"
  on public.books for insert
  with check (
    auth.uid() is not null
    and owner_id = auth.uid()
    and (auth.jwt() ->> 'is_anonymous')::boolean is not true
  );

create policy "books: update by members"
  on public.books for update
  using (
    public.is_book_member(id)
    and (auth.jwt() ->> 'is_anonymous')::boolean is not true
  )
  with check (
    public.is_book_member(id)
    and (auth.jwt() ->> 'is_anonymous')::boolean is not true
  );

create policy "books: delete by owner"
  on public.books for delete
  using (public.is_book_owner(id));

create policy "members: select for book members"
  on public.members for select
  using (public.is_book_member(book_id));

create policy "members: insert by book owner"
  on public.members for insert
  with check (public.is_book_owner(book_id));

create policy "members: update by owner or self"
  on public.members for update
  using (public.is_book_owner(book_id) or profile_id is null or profile_id = auth.uid())
  with check (
    -- owner 可以改 display_name 或把 profile_id 設為 null（unclaim）
    -- 本人可以把 profile_id 設為自己（claim）或 null（離開帳本）
    public.is_book_owner(book_id)
    or profile_id = auth.uid()
    or (profile_id is null and auth.uid() is not null)
  );

create policy "members: delete by book owner"
  on public.members for delete
  using (public.is_book_owner(book_id));

create policy "expenses: select for book members"
  on public.expenses for select
  using (public.is_book_member(book_id));

create policy "expenses: insert by authenticated book members"
  on public.expenses for insert
  with check (
    public.is_book_member(book_id)
    and (auth.jwt() ->> 'is_anonymous')::boolean is not true
  );

create policy "expenses: update by book members"
  on public.expenses for update
  using (
    public.is_book_member(book_id)
    and (auth.jwt() ->> 'is_anonymous')::boolean is not true
  )
  with check (
    public.is_book_member(book_id)
    and (auth.jwt() ->> 'is_anonymous')::boolean is not true
  );

create policy "expenses: delete by book members"
  on public.expenses for delete
  using (
    public.is_book_member(book_id)
    and (auth.jwt() ->> 'is_anonymous')::boolean is not true
  );

create policy "expense_splits: select follows expense"
  on public.expense_splits for select
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and public.is_book_member(e.book_id)
    )
  );

create policy "expense_splits: insert follows expense insert"
  on public.expense_splits for insert
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id
        and public.is_book_member(e.book_id)
        and (auth.jwt() ->> 'is_anonymous')::boolean is not true
    )
  );

create policy "expense_splits: update follows expense update"
  on public.expense_splits for update
  using (
    exists (
      select 1
      from public.expenses e
      join public.members m on m.id = e.payer_member_id
      where e.id = expense_splits.expense_id
        and (public.is_book_owner(e.book_id) or m.profile_id = auth.uid())
    )
  );

create policy "expense_splits: delete follows expense delete"
  on public.expense_splits for delete
  using (
    exists (
      select 1
      from public.expenses e
      join public.members m on m.id = e.payer_member_id
      where e.id = expense_splits.expense_id
        and (public.is_book_owner(e.book_id) or m.profile_id = auth.uid())
    )
  );

create policy "settlements: select for book members"
  on public.settlements for select
  using (public.is_book_member(book_id));

create policy "settlements: insert by book members"
  on public.settlements for insert
  with check (
    public.is_book_member(book_id)
    and (auth.jwt() ->> 'is_anonymous')::boolean is not true
  );

-- RPC: 在同一個 transaction 內新增費用、splits，並可選擇性新增自訂分類。
-- pending_category 為 null 時跳過分類更新。
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

-- RPC: 在同一個 transaction 內更新費用、重建 splits，並可選擇性新增自訂分類。
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

-- RPC: 一次回傳帳本詳情頁所需的全部資料（book + members + expenses + settlements），
-- 取代前端原本各自獨立的 4 次 round trip。
--
-- security invoker（預設值，此處明寫僅為清楚標示）：以呼叫者權限執行，
-- 完整套用既有 RLS policy（members: select for book members 等），
-- 不會像 security definer 一樣繞過列權限控管。
-- 若呼叫者不是該帳本成員，RLS 會過濾掉所有子查詢結果，'book' 為 null 且陣列為空。
create or replace function public.get_book_bundle(p_book_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'book', (
      select to_jsonb(b) || jsonb_build_object(
        'members', coalesce((
          select jsonb_agg(
            to_jsonb(m) || jsonb_build_object('profile', to_jsonb(pr))
            order by m.created_at asc
          )
          from public.members m
          left join public.profiles pr on pr.id = m.profile_id
          where m.book_id = b.id
        ), '[]'::jsonb)
      )
      from public.books b
      where b.id = p_book_id
    ),
    'members', coalesce((
      select jsonb_agg(
        to_jsonb(m) || jsonb_build_object('profile', to_jsonb(pr))
        order by m.created_at asc
      )
      from public.members m
      left join public.profiles pr on pr.id = m.profile_id
      where m.book_id = p_book_id
    ), '[]'::jsonb),
    'expenses', coalesce((
      select jsonb_agg(
        to_jsonb(e) || jsonb_build_object(
          'payer', to_jsonb(payer_m),
          'expense_splits', coalesce((
            select jsonb_agg(to_jsonb(es) || jsonb_build_object('member', to_jsonb(sm)))
            from public.expense_splits es
            join public.members sm on sm.id = es.member_id
            where es.expense_id = e.id
          ), '[]'::jsonb)
        )
        order by e.date desc, e.created_at desc
      )
      from public.expenses e
      join public.members payer_m on payer_m.id = e.payer_member_id
      where e.book_id = p_book_id
    ), '[]'::jsonb),
    'settlements', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.created_at asc)
      from public.settlements s
      where s.book_id = p_book_id
    ), '[]'::jsonb)
  )
  where exists (select 1 from public.books b2 where b2.id = p_book_id);
$$;
