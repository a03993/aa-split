import type {
  BookRow,
  BookWithMembers,
  ExpenseRow,
  ExpenseSplitRow,
  ExpenseWithDetails,
  Member,
  ProfileRow,
  SettlementRow,
} from "@/types/app.types"

// 切換目前的 mock 使用者：取消註解想要的那行，並將其他行註解掉。
// 創建者
export const MOCK_USER_ID = "mock-user-id-alice"
export const MOCK_USER_NAME = "Alice"
// 成員
// export const MOCK_USER_ID = "mock-user-id-bob"
// export const MOCK_USER_NAME = "Bob"
// 非成員
// export const MOCK_USER_ID = "mock-user-id-dave"
// export const MOCK_USER_NAME = "Dave"

const T_BOOK_CREATED = "2024-05-01T10:00:00.000Z"
const T_BOOK_UPDATED = "2024-05-03T22:00:00.000Z"
const T_MEMBER_ALICE = "2024-05-01T10:00:00.000Z"
const T_MEMBER_BOB = "2024-05-01T10:00:01.000Z"
const T_MEMBER_CAROL = "2024-05-01T10:00:02.000Z"
const T_USER_ALICE = "2024-04-01T08:00:00.000Z"

export const MOCK_BOOK_ID = "mock-book-taipei-trip"
export const MOCK_USER_ALICE_ID = "mock-user-id-alice"
export const MOCK_MEMBER_ALICE_ID = "mock-member-alice"
export const MOCK_MEMBER_BOB_ID = "mock-member-bob"
export const MOCK_MEMBER_CAROL_ID = "mock-member-carol"

const MOCK_EXP_DINNER_ID = "mock-expense-dinner"
const MOCK_EXP_TAXI_ID = "mock-expense-taxi"
const MOCK_EXP_HOTEL_ID = "mock-expense-hotel"
const MOCK_EXP_MEDICINE_ID = "mock-expense-medicine"

const MOCK_SPLIT_DINNER_ALICE_ID = "mock-split-dinner-alice"
const MOCK_SPLIT_DINNER_BOB_ID = "mock-split-dinner-bob"
const MOCK_SPLIT_DINNER_CAROL_ID = "mock-split-dinner-carol"
const MOCK_SPLIT_TAXI_ALICE_ID = "mock-split-taxi-alice"
const MOCK_SPLIT_TAXI_BOB_ID = "mock-split-taxi-bob"
const MOCK_SPLIT_TAXI_CAROL_ID = "mock-split-taxi-carol"
const MOCK_SPLIT_HOTEL_ALICE_ID = "mock-split-hotel-alice"
const MOCK_SPLIT_HOTEL_BOB_ID = "mock-split-hotel-bob"
const MOCK_SPLIT_HOTEL_CAROL_ID = "mock-split-hotel-carol"
const MOCK_SPLIT_MEDICINE_ALICE_ID = "mock-split-medicine-alice"
const MOCK_SPLIT_MEDICINE_BOB_ID = "mock-split-medicine-bob"
const MOCK_SPLIT_MEDICINE_CAROL_ID = "mock-split-medicine-carol"

export const MOCK_USER_ALICE: ProfileRow = {
  id: MOCK_USER_ALICE_ID,
  line_user_id: "line-uid-alice",
  display_name: "Alice",
  avatar_url: "",
  created_at: T_USER_ALICE,
}

export const MOCK_USER_BOB: ProfileRow = {
  id: "mock-user-id-bob",
  line_user_id: "line-uid-bob",
  display_name: "Bob",
  avatar_url: "",
  created_at: T_USER_ALICE,
}

export const MOCK_USER_CAROL: ProfileRow = {
  id: "mock-user-id-carol",
  line_user_id: "line-uid-carol",
  display_name: "Carol",
  avatar_url: "",
  created_at: T_USER_ALICE,
}

export const MOCK_MEMBER_ALICE: Member = {
  id: MOCK_MEMBER_ALICE_ID,
  book_id: MOCK_BOOK_ID,
  display_name: "Alice",
  profile_id: MOCK_USER_ALICE_ID,
  created_at: T_MEMBER_ALICE,
  profile: MOCK_USER_ALICE,
}

export const MOCK_MEMBER_BOB: Member = {
  id: MOCK_MEMBER_BOB_ID,
  book_id: MOCK_BOOK_ID,
  display_name: "Bob",
  profile_id: "mock-user-id-bob",
  created_at: T_MEMBER_BOB,
  profile: MOCK_USER_BOB,
}

export const MOCK_MEMBER_CAROL: Member = {
  id: MOCK_MEMBER_CAROL_ID,
  book_id: MOCK_BOOK_ID,
  display_name: "Carol",
  profile_id: "mock-user-id-carol",
  created_at: T_MEMBER_CAROL,
  profile: MOCK_USER_CAROL,
}

// 未認領的佔位成員：沒有綁定 profile_id，用來測試 claim / 訪客瀏覽 flow。
// 切到 MOCK_USER_ID = mock-user-id-dave 時，Dave 不是任何 member 的 profile_id，
// 會被視為非成員，觸發 ClaimDialog 自動彈出。
export const MOCK_MEMBER_DAVE_ID = "mock-member-dave"
export const MOCK_MEMBER_DAVE_PLACEHOLDER: Member = {
  id: MOCK_MEMBER_DAVE_ID,
  book_id: MOCK_BOOK_ID,
  display_name: "Dave",
  profile_id: null,
  created_at: "2024-05-01T10:00:03.000Z",
  profile: null,
}

export const MOCK_BOOK: BookRow = {
  id: MOCK_BOOK_ID,
  name: "台北週末之旅",
  owner_id: MOCK_USER_ALICE_ID,
  settled_at: null,
  settlement_currency: null,
  exchange_rate: null,
  custom_categories: [],
  currency: "TWD",
  created_at: T_BOOK_CREATED,
  updated_at: T_BOOK_UPDATED,
}

export const MOCK_BOOK_WITH_MEMBERS: BookWithMembers = {
  ...MOCK_BOOK,
  members: [MOCK_MEMBER_ALICE, MOCK_MEMBER_BOB, MOCK_MEMBER_CAROL, MOCK_MEMBER_DAVE_PLACEHOLDER],
}

export const MOCK_EXPENSE_DINNER: ExpenseRow = {
  id: MOCK_EXP_DINNER_ID,
  book_id: MOCK_BOOK_ID,
  title: "晚餐",
  category: "food",
  amount: 900,
  payer_member_id: MOCK_MEMBER_ALICE_ID,
  split_mode: "equal",
  date: "2024-05-01",
  time: "19:30:00",
  created_at: "2024-05-01T12:00:00.000Z",
  updated_at: "2024-05-01T12:00:00.000Z",
}

export const MOCK_EXPENSE_TAXI: ExpenseRow = {
  id: MOCK_EXP_TAXI_ID,
  book_id: MOCK_BOOK_ID,
  title: "計程車",
  category: "transport",
  amount: 240,
  payer_member_id: MOCK_MEMBER_BOB_ID,
  split_mode: "equal",
  date: "2024-05-02",
  time: "09:15:00",
  created_at: "2024-05-02T09:00:00.000Z",
  updated_at: "2024-05-02T09:00:00.000Z",
}

export const MOCK_EXPENSE_HOTEL: ExpenseRow = {
  id: MOCK_EXP_HOTEL_ID,
  book_id: MOCK_BOOK_ID,
  title: "住宿",
  category: "accommodation",
  amount: 3600,
  payer_member_id: MOCK_MEMBER_ALICE_ID,
  split_mode: "equal",
  date: "2024-05-02",
  time: "15:00:00",
  created_at: "2024-05-02T15:00:00.000Z",
  updated_at: "2024-05-02T15:00:00.000Z",
}

export const MOCK_EXPENSE_MEDICINE: ExpenseRow = {
  id: MOCK_EXP_MEDICINE_ID,
  book_id: MOCK_BOOK_ID,
  title: "零食",
  category: "shopping",
  amount: 150,
  payer_member_id: MOCK_MEMBER_CAROL_ID,
  split_mode: "custom",
  date: "2024-05-03",
  time: "11:30:00",
  created_at: "2024-05-03T11:00:00.000Z",
  updated_at: "2024-05-03T11:00:00.000Z",
}

export const MOCK_SPLIT_DINNER_ALICE: ExpenseSplitRow = {
  id: MOCK_SPLIT_DINNER_ALICE_ID,
  expense_id: MOCK_EXP_DINNER_ID,
  member_id: MOCK_MEMBER_ALICE_ID,
  amount: 300,
  shares: 1,
  created_at: "2024-05-01T12:00:00.000Z",
}
export const MOCK_SPLIT_DINNER_BOB: ExpenseSplitRow = {
  id: MOCK_SPLIT_DINNER_BOB_ID,
  expense_id: MOCK_EXP_DINNER_ID,
  member_id: MOCK_MEMBER_BOB_ID,
  amount: 300,
  shares: 1,
  created_at: "2024-05-01T12:00:00.000Z",
}
export const MOCK_SPLIT_DINNER_CAROL: ExpenseSplitRow = {
  id: MOCK_SPLIT_DINNER_CAROL_ID,
  expense_id: MOCK_EXP_DINNER_ID,
  member_id: MOCK_MEMBER_CAROL_ID,
  amount: 300,
  shares: 1,
  created_at: "2024-05-01T12:00:00.000Z",
}

export const MOCK_SPLIT_TAXI_ALICE: ExpenseSplitRow = {
  id: MOCK_SPLIT_TAXI_ALICE_ID,
  expense_id: MOCK_EXP_TAXI_ID,
  member_id: MOCK_MEMBER_ALICE_ID,
  amount: 80,
  shares: 1,
  created_at: "2024-05-02T09:00:00.000Z",
}
export const MOCK_SPLIT_TAXI_BOB: ExpenseSplitRow = {
  id: MOCK_SPLIT_TAXI_BOB_ID,
  expense_id: MOCK_EXP_TAXI_ID,
  member_id: MOCK_MEMBER_BOB_ID,
  amount: 80,
  shares: 1,
  created_at: "2024-05-02T09:00:00.000Z",
}
export const MOCK_SPLIT_TAXI_CAROL: ExpenseSplitRow = {
  id: MOCK_SPLIT_TAXI_CAROL_ID,
  expense_id: MOCK_EXP_TAXI_ID,
  member_id: MOCK_MEMBER_CAROL_ID,
  amount: 80,
  shares: 1,
  created_at: "2024-05-02T09:00:00.000Z",
}

export const MOCK_SPLIT_HOTEL_ALICE: ExpenseSplitRow = {
  id: MOCK_SPLIT_HOTEL_ALICE_ID,
  expense_id: MOCK_EXP_HOTEL_ID,
  member_id: MOCK_MEMBER_ALICE_ID,
  amount: 1200,
  shares: 1,
  created_at: "2024-05-02T15:00:00.000Z",
}
export const MOCK_SPLIT_HOTEL_BOB: ExpenseSplitRow = {
  id: MOCK_SPLIT_HOTEL_BOB_ID,
  expense_id: MOCK_EXP_HOTEL_ID,
  member_id: MOCK_MEMBER_BOB_ID,
  amount: 1200,
  shares: 1,
  created_at: "2024-05-02T15:00:00.000Z",
}
export const MOCK_SPLIT_HOTEL_CAROL: ExpenseSplitRow = {
  id: MOCK_SPLIT_HOTEL_CAROL_ID,
  expense_id: MOCK_EXP_HOTEL_ID,
  member_id: MOCK_MEMBER_CAROL_ID,
  amount: 1200,
  shares: 1,
  created_at: "2024-05-02T15:00:00.000Z",
}

export const MOCK_SPLIT_MEDICINE_ALICE: ExpenseSplitRow = {
  id: MOCK_SPLIT_MEDICINE_ALICE_ID,
  expense_id: MOCK_EXP_MEDICINE_ID,
  member_id: MOCK_MEMBER_ALICE_ID,
  amount: 100,
  shares: null,
  created_at: "2024-05-03T11:00:00.000Z",
}
export const MOCK_SPLIT_MEDICINE_BOB: ExpenseSplitRow = {
  id: MOCK_SPLIT_MEDICINE_BOB_ID,
  expense_id: MOCK_EXP_MEDICINE_ID,
  member_id: MOCK_MEMBER_BOB_ID,
  amount: 50,
  shares: null,
  created_at: "2024-05-03T11:00:00.000Z",
}
export const MOCK_SPLIT_MEDICINE_CAROL: ExpenseSplitRow = {
  id: MOCK_SPLIT_MEDICINE_CAROL_ID,
  expense_id: MOCK_EXP_MEDICINE_ID,
  member_id: MOCK_MEMBER_CAROL_ID,
  amount: 0,
  shares: null,
  created_at: "2024-05-03T11:00:00.000Z",
}

export const MOCK_EXPENSE_DINNER_WITH_DETAILS: ExpenseWithDetails = {
  ...MOCK_EXPENSE_DINNER,
  payer: MOCK_MEMBER_ALICE,
  expense_splits: [
    { ...MOCK_SPLIT_DINNER_ALICE, member: MOCK_MEMBER_ALICE },
    { ...MOCK_SPLIT_DINNER_BOB, member: MOCK_MEMBER_BOB },
    { ...MOCK_SPLIT_DINNER_CAROL, member: MOCK_MEMBER_CAROL },
  ],
}

export const MOCK_EXPENSE_TAXI_WITH_DETAILS: ExpenseWithDetails = {
  ...MOCK_EXPENSE_TAXI,
  payer: MOCK_MEMBER_BOB,
  expense_splits: [
    { ...MOCK_SPLIT_TAXI_ALICE, member: MOCK_MEMBER_ALICE },
    { ...MOCK_SPLIT_TAXI_BOB, member: MOCK_MEMBER_BOB },
    { ...MOCK_SPLIT_TAXI_CAROL, member: MOCK_MEMBER_CAROL },
  ],
}

export const MOCK_EXPENSE_HOTEL_WITH_DETAILS: ExpenseWithDetails = {
  ...MOCK_EXPENSE_HOTEL,
  payer: MOCK_MEMBER_ALICE,
  expense_splits: [
    { ...MOCK_SPLIT_HOTEL_ALICE, member: MOCK_MEMBER_ALICE },
    { ...MOCK_SPLIT_HOTEL_BOB, member: MOCK_MEMBER_BOB },
    { ...MOCK_SPLIT_HOTEL_CAROL, member: MOCK_MEMBER_CAROL },
  ],
}

export const MOCK_EXPENSE_MEDICINE_WITH_DETAILS: ExpenseWithDetails = {
  ...MOCK_EXPENSE_MEDICINE,
  payer: MOCK_MEMBER_CAROL,
  expense_splits: [
    { ...MOCK_SPLIT_MEDICINE_ALICE, member: MOCK_MEMBER_ALICE },
    { ...MOCK_SPLIT_MEDICINE_BOB, member: MOCK_MEMBER_BOB },
    { ...MOCK_SPLIT_MEDICINE_CAROL, member: MOCK_MEMBER_CAROL },
  ],
}

export const MOCK_SETTLEMENTS: SettlementRow[] = []

export const MOCK_BOOKS: BookRow[] = [{ ...MOCK_BOOK }]

export const MOCK_MEMBERS: Member[] = [
  { ...MOCK_MEMBER_ALICE },
  { ...MOCK_MEMBER_BOB },
  { ...MOCK_MEMBER_CAROL },
  { ...MOCK_MEMBER_DAVE_PLACEHOLDER },
]

export const MOCK_EXPENSES: ExpenseRow[] = [
  { ...MOCK_EXPENSE_DINNER },
  { ...MOCK_EXPENSE_TAXI },
  { ...MOCK_EXPENSE_HOTEL },
  { ...MOCK_EXPENSE_MEDICINE },
]

export const MOCK_EXPENSE_SPLITS: ExpenseSplitRow[] = [
  { ...MOCK_SPLIT_DINNER_ALICE },
  { ...MOCK_SPLIT_DINNER_BOB },
  { ...MOCK_SPLIT_DINNER_CAROL },
  { ...MOCK_SPLIT_TAXI_ALICE },
  { ...MOCK_SPLIT_TAXI_BOB },
  { ...MOCK_SPLIT_TAXI_CAROL },
  { ...MOCK_SPLIT_HOTEL_ALICE },
  { ...MOCK_SPLIT_HOTEL_BOB },
  { ...MOCK_SPLIT_HOTEL_CAROL },
  { ...MOCK_SPLIT_MEDICINE_ALICE },
  { ...MOCK_SPLIT_MEDICINE_BOB },
  { ...MOCK_SPLIT_MEDICINE_CAROL },
]
