/**
 * Unified store — works offline (localStorage) and syncs to Supabase.
 * Uses useSyncExternalStore so any React component can subscribe.
 */

import { useRef, useSyncExternalStore } from "react";
import { supabase, hasSupabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TxStatus = "pending" | "successful" | "failed";
export type TxKind = "credit" | "debit";

/** Fixed beneficiary/bank details used both to register a recipient and to record a transfer */
export type Beneficiary = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankAddress: string;
  country: string;
  swiftCode: string;
  ibanNumber: string;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  pin: string;
  balance: number;
  status: "active" | "frozen";
  avatar?: string;
  /** Fixed beneficiary details — how this user is identified/paid as a transfer recipient */
  beneficiary: Beneficiary;
  createdAt: number;
};

export type AppTransaction = {
  id: string;
  userId: string;
  merchant: string;
  category: string;
  amount: number;
  status: TxStatus;
  kind: TxKind;
  note?: string;
  createdAt: number;
  deleted: boolean;
  source: "admin" | "user" | "system";
  /** Snapshot of the beneficiary details entered at transfer time (transfers only) */
  beneficiary?: Beneficiary;
};

export type AppState = {
  adminBalance: number;
  users: AppUser[];
  transactions: AppTransaction[];
  hydrated: boolean;
};

// ── Storage key ───────────────────────────────────────────────────────────────

const LS_KEY = "santander.store.v1";

// ── Seed data ─────────────────────────────────────────────────────────────────

function seed(): AppState {
  const now = Date.now();
  const d = 86_400_000;
  const users: AppUser[] = [
    {
      id: "alex",
      name: "Alex Morgan",
      email: "alex@santander.app",
      password: "demo1234",
      pin: "1234",
      balance: 4827.42,
      status: "active",
      beneficiary: {
        accountName: "Alex Morgan",
        accountNumber: "88421097",
        bankName: "Santander UK",
        bankAddress: "2 Triton Square, London, NW1 3AN",
        country: "United Kingdom",
        swiftCode: "ABBYGB2L",
        ibanNumber: "GB29 ABBY 0429 1588 4210 97",
      },
      createdAt: now - 90 * d,
    },
    {
      id: "sarah",
      name: "Sarah Kennedy",
      email: "sarah.k@gmail.com",
      password: "demo1234",
      pin: "1234",
      balance: 1240.10,
      status: "active",
      beneficiary: {
        accountName: "Sarah Kennedy",
        accountNumber: "55238821",
        bankName: "Monzo Bank",
        bankAddress: "Broadwalk House, 5 Appold Street, London, EC2A 2AG",
        country: "United Kingdom",
        swiftCode: "MONZGB2L",
        ibanNumber: "GB44 MONZ 0400 0455 2388 21",
      },
      createdAt: now - 60 * d,
    },
    {
      id: "james",
      name: "James Patel",
      email: "j.patel@outlook.com",
      password: "demo1234",
      pin: "1234",
      balance: 312.55,
      status: "active",
      beneficiary: {
        accountName: "James Patel",
        accountNumber: "33187765",
        bankName: "Starling Bank",
        bankAddress: "Churchill Place, London, E14 5HU",
        country: "United Kingdom",
        swiftCode: "SRLGGB2L",
        ibanNumber: "GB57 SRLG 0412 0833 1877 65",
      },
      createdAt: now - 30 * d,
    },
    {
      id: "mia",
      name: "Mia Tanaka",
      email: "mia.t@santander.app",
      password: "demo1234",
      pin: "4321",
      balance: 8920.00,
      status: "active",
      beneficiary: {
        accountName: "Mia Tanaka",
        accountNumber: "00977024419",
        bankName: "Revolut Ltd",
        bankAddress: "7 Westferry Circus, London, E14 4HD",
        country: "United Kingdom",
        swiftCode: "REVOGB21",
        ibanNumber: "GB29 REVO 0099 7702 4419 00",
      },
      createdAt: now - 14 * d,
    },
    {
      id: "tom",
      name: "Tom Becker",
      email: "tbecker@proton.me",
      password: "demo1234",
      pin: "0000",
      balance: 56.78,
      status: "frozen",
      beneficiary: {
        accountName: "Tom Becker",
        accountNumber: "10293847",
        bankName: "Barclays Bank UK",
        bankAddress: "1 Churchill Place, London, E14 5HP",
        country: "United Kingdom",
        swiftCode: "BARCGB22",
        ibanNumber: "GB91 BARC 2032 1110 2938 47",
      },
      createdAt: now - 5 * d,
    },
  ];

  const transactions: AppTransaction[] = [
    { id: "t1",  userId: "alex",  merchant: "Pret A Manger",          category: "food",     amount: -6.45,   status: "successful", kind: "debit",  createdAt: now - 3_600_000,         deleted: false, source: "user" },
    { id: "t2",  userId: "alex",  merchant: "Salary — Northwind Ltd", category: "income",   amount: 2890.0,  status: "successful", kind: "credit", createdAt: now - 1 * d,             deleted: false, source: "system" },
    { id: "t3",  userId: "alex",  merchant: "Transport for London",   category: "transit",  amount: -8.40,   status: "successful", kind: "debit",  createdAt: now - 1 * d - 1_800_000, deleted: false, source: "user" },
    { id: "t4",  userId: "alex",  merchant: "Spotify",                category: "subs",     amount: -11.99,  status: "successful", kind: "debit",  createdAt: now - 4 * d,             deleted: false, source: "user" },
    { id: "t5",  userId: "alex",  merchant: "Sarah Kennedy",          category: "transfer", amount: 40.0,    status: "successful", kind: "credit", createdAt: now - 5 * d, deleted: false, source: "user",
      beneficiary: users[1].beneficiary },
    { id: "t6",  userId: "alex",  merchant: "Tesco",                  category: "food",     amount: -42.18,  status: "successful", kind: "debit",  createdAt: now - 6 * d,             deleted: false, source: "user" },
    { id: "t7",  userId: "alex",  merchant: "EE Mobile",              category: "bills",    amount: -22.0,   status: "pending",    kind: "debit",  createdAt: now - 8 * d,             deleted: false, source: "user" },
    { id: "t8",  userId: "sarah", merchant: "Uber",                   category: "transit",  amount: -14.20,  status: "successful", kind: "debit",  createdAt: now - 2 * d,             deleted: false, source: "user" },
    { id: "t9",  userId: "james", merchant: "Wage — Acme Co",         category: "income",   amount: 1850.0,  status: "pending",    kind: "credit", createdAt: now - 3 * d,             deleted: false, source: "system" },
    { id: "t10", userId: "mia",   merchant: "Apple Store",            category: "shop",     amount: -1199.0, status: "successful", kind: "debit",  createdAt: now - 7 * d,             deleted: false, source: "user" },
  ];

  return { adminBalance: 2_000_000, users, transactions, hydrated: false };
}

// ── Load / Persist ────────────────────────────────────────────────────────────

function loadFromLS(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(LS_KEY, JSON.stringify(s));
      return s;
    }
    return { ...(JSON.parse(raw) as AppState), hydrated: false };
  } catch {
    return seed();
  }
}

function persistToLS(s: AppState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch { /* storage quota */ }
}

// ── Supabase push helpers ─────────────────────────────────────────────────────

async function pushUser(u: AppUser) {
  if (!hasSupabase) return;
  await supabase.from("santander_users").upsert({
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    pin: u.pin,
    balance: u.balance,
    status: u.status,
    avatar: u.avatar ?? null,
    bank: u.beneficiary.bankName,
    bank_details: u.beneficiary,
    sort_code: null,
    account_number: u.beneficiary.accountNumber,
    created_at: new Date(u.createdAt).toISOString(),
  });
}

async function pushTx(t: AppTransaction) {
  if (!hasSupabase) return;
  await supabase.from("santander_transactions").upsert({
    id: t.id,
    user_id: t.userId,
    merchant: t.merchant,
    category: t.category,
    amount: t.amount,
    status: t.status,
    kind: t.kind,
    bank: t.beneficiary?.bankName ?? null,
    note: t.note ?? null,
    created_at: new Date(t.createdAt).toISOString(),
    deleted: t.deleted,
    source: t.source,
    beneficiary: t.beneficiary ?? null,
  });
}

async function pushAdminBalance(balance: number) {
  if (!hasSupabase) return;
  await supabase.from("santander_admin").upsert({ id: "main", balance });
}

// ── Store core ────────────────────────────────────────────────────────────────

let state: AppState = loadFromLS();
const listeners = new Set<() => void>();

function emit() {
  persistToLS(state);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// ── Unique ID generator ───────────────────────────────────────────────────────
// Uses a counter suffix to prevent collisions within the same millisecond
let _idCounter = 0;
function uid(prefix = "tx"): string {
  _idCounter = (_idCounter + 1) % 10000;
  return `${prefix}${Date.now().toString(36)}${_idCounter.toString(36).padStart(2, "0")}`;
}

// ── Supabase hydration & realtime ─────────────────────────────────────────────

let hydrateRan = false;

export async function hydrateFromSupabase() {
  // No Supabase configured — just mark as hydrated and use localStorage
  if (!hasSupabase) {
    state = { ...state, hydrated: true };
    emit();
    return;
  }
  // Only run once per page load
  if (hydrateRan) return;
  hydrateRan = true;

  try {
    const [usersRes, txRes, adminRes] = await Promise.all([
      supabase.from("santander_users").select("*"),
      supabase.from("santander_transactions").select("*"),
      supabase.from("santander_admin").select("*").eq("id", "main").single(),
    ]);

    const remoteUsers: AppUser[] = (usersRes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      password: r.password,
      pin: r.pin,
      balance: Number(r.balance),
      status: r.status as AppUser["status"],
      avatar: r.avatar ?? undefined,
      beneficiary: (r.bank_details ?? {}) as Beneficiary,
      createdAt: new Date(r.created_at).getTime(),
    }));

    const remoteTxs: AppTransaction[] = (txRes.data ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      merchant: r.merchant,
      category: r.category,
      amount: Number(r.amount),
      status: r.status as TxStatus,
      kind: r.kind as TxKind,
      note: r.note ?? undefined,
      createdAt: new Date(r.created_at).getTime(),
      deleted: r.deleted,
      source: r.source as AppTransaction["source"],
      beneficiary: (r.beneficiary as Beneficiary) ?? undefined,
    }));

    const adminBalance = adminRes.data ? Number(adminRes.data.balance) : state.adminBalance;

    if (remoteUsers.length > 0) {
      // Supabase has data — use it as source of truth
      state = { adminBalance, users: remoteUsers, transactions: remoteTxs, hydrated: true };
    } else {
      // First boot — push local seed data up to Supabase
      state = { ...state, hydrated: true };
      await Promise.all([
        ...state.users.map(pushUser),
        ...state.transactions.map(pushTx),
        pushAdminBalance(state.adminBalance),
      ]);
    }
    emit();
  } catch (err) {
    console.error("[Store] Supabase hydration failed:", err);
    state = { ...state, hydrated: true };
    emit();
  }

  // Realtime — listen for changes pushed from other sessions/admin
  supabase
    .channel("santander-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "santander_users" }, (payload) => {
      if (payload.eventType === "DELETE") {
        const id = (payload.old as { id?: string }).id;
        if (id) {
          state = { ...state, users: state.users.filter((u) => u.id !== id) };
          emit();
        }
        return;
      }
      const r = payload.new as Record<string, unknown>;
      if (!r?.id) return;
      const updated: AppUser = {
        id: r.id as string,
        name: r.name as string,
        email: r.email as string,
        password: r.password as string,
        pin: r.pin as string,
        balance: Number(r.balance),
        status: r.status as AppUser["status"],
        avatar: (r.avatar as string) ?? undefined,
        beneficiary: (r.bank_details as Beneficiary) ?? ({} as Beneficiary),
        createdAt: new Date(r.created_at as string).getTime(),
      };
      const exists = state.users.some((u) => u.id === updated.id);
      state = {
        ...state,
        users: exists
          ? state.users.map((u) => (u.id === updated.id ? updated : u))
          : [updated, ...state.users],
      };
      emit();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "santander_transactions" }, (payload) => {
      if (payload.eventType === "DELETE") {
        const id = (payload.old as { id?: string }).id;
        if (id) {
          state = { ...state, transactions: state.transactions.filter((t) => t.id !== id) };
          emit();
        }
        return;
      }
      const r = payload.new as Record<string, unknown>;
      if (!r?.id) return;
      const updated: AppTransaction = {
        id: r.id as string,
        userId: r.user_id as string,
        merchant: r.merchant as string,
        category: r.category as string,
        amount: Number(r.amount),
        status: r.status as TxStatus,
        kind: r.kind as TxKind,
        note: (r.note as string) ?? undefined,
        createdAt: new Date(r.created_at as string).getTime(),
        deleted: r.deleted as boolean,
        source: r.source as AppTransaction["source"],
        beneficiary: (r.beneficiary as Beneficiary) ?? undefined,
      };
      const exists = state.transactions.some((t) => t.id === updated.id);
      state = {
        ...state,
        transactions: exists
          ? state.transactions.map((t) => (t.id === updated.id ? updated : t))
          : [updated, ...state.transactions],
      };
      emit();
    })
    .subscribe();
}

// ── React hook ────────────────────────────────────────────────────────────────

export function useStore<T>(selector: (s: AppState) => T): T {
  // Cache the last result keyed by state reference — avoids re-running selector
  // when state hasn't changed, regardless of whether selector fn is stable.
  const cache = useRef<{ state: AppState; value: T } | null>(null);
  const snap = () => {
    if (cache.current && cache.current.state === state) return cache.current.value;
    const value = selector(state);
    cache.current = { state, value };
    return value;
  };
  return useSyncExternalStore(subscribe, snap, snap);
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function gbp(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}£${Math.abs(n).toFixed(2)}`;
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ── Selectors ─────────────────────────────────────────────────────────────────

export function selectUser(id: string) {
  return (s: AppState) => s.users.find((u) => u.id === id);
}

/** Returns the user's name, or "Deleted user" if the account no longer exists. */
export function userDisplayName(s: AppState, userId: string): string {
  return s.users.find((u) => u.id === userId)?.name ?? "Deleted user";
}

export function findUserByEmail(email: string): AppUser | undefined {
  return state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

/**
 * Match a typed-in beneficiary against registered users. A match requires the
 * account number AND swift code AND IBAN to all match (normalised — spaces/
 * dashes stripped, case-insensitive). This is the only way a transfer can
 * resolve to an internal recipient.
 */
export function findUserByBeneficiary(input: Partial<Beneficiary>): AppUser | undefined {
  const accNum = input.accountNumber?.trim();
  const swift = input.swiftCode?.trim();
  const iban = input.ibanNumber?.trim();
  if (!accNum || !swift || !iban) return undefined;

  return state.users.find((u) => {
    const b = u.beneficiary;
    if (!b) return false;
    return (
      norm(b.accountNumber) === norm(accNum) &&
      norm(b.swiftCode) === norm(swift) &&
      norm(b.ibanNumber) === norm(iban)
    );
  });
}

function norm(v: string): string {
  return (v ?? "").replace(/[\s\-]/g, "").toUpperCase();
}

export function selectUserTransactions(userId: string, opts: { includeDeleted?: boolean } = {}) {
  return (s: AppState) =>
    s.transactions
      .filter((t) => t.userId === userId && (opts.includeDeleted || !t.deleted))
      .sort((a, b) => b.createdAt - a.createdAt);
}

export function selectAllTransactions(opts: { includeDeleted?: boolean } = {}) {
  return (s: AppState) =>
    s.transactions
      .filter((t) => opts.includeDeleted || !t.deleted)
      .sort((a, b) => b.createdAt - a.createdAt);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export const store = {
  get state() { return state; },

  addUser(input: {
    name: string;
    email: string;
    password: string;
    pin: string;
    startingBalance: number;
    avatar?: string;
    beneficiary: Beneficiary;
  }): AppUser {
    const id = uid("u");

    const user: AppUser = {
      id,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      pin: input.pin,
      balance: +Math.max(0, input.startingBalance).toFixed(2),
      status: "active",
      avatar: input.avatar,
      beneficiary: {
        accountName: input.beneficiary.accountName.trim(),
        accountNumber: input.beneficiary.accountNumber.trim(),
        bankName: input.beneficiary.bankName.trim(),
        bankAddress: input.beneficiary.bankAddress.trim(),
        country: input.beneficiary.country.trim(),
        swiftCode: input.beneficiary.swiftCode.trim().toUpperCase(),
        ibanNumber: input.beneficiary.ibanNumber.trim().toUpperCase(),
      },
      createdAt: Date.now(),
    };

    state = { ...state, users: [user, ...state.users] };

    if (input.startingBalance > 0) {
      const tx: AppTransaction = {
        id: uid("tx"),
        userId: id,
        merchant: "Account opening credit",
        category: "income",
        amount: +input.startingBalance.toFixed(2),
        status: "successful",
        kind: "credit",
        createdAt: Date.now(),
        deleted: false,
        source: "admin",
        note: "Initial balance",
      };
      state = { ...state, transactions: [tx, ...state.transactions] };
      pushTx(tx);
    }

    emit();
    pushUser(user);
    return user;
  },

  fundUser(input: {
    userId: string;
    amount: number;
    note?: string;
    fromAdmin: boolean;
    status?: TxStatus;
  }) {
    const amount = +Math.max(0, input.amount).toFixed(2);
    const status: TxStatus = input.status ?? "successful";

    // BUG FIX: only update balance if status is successful
    const users = state.users.map((u) =>
      u.id === input.userId && status === "successful"
        ? { ...u, balance: +(u.balance + amount).toFixed(2) }
        : u
    );

    // BUG FIX: only deduct admin balance if status is successful
    const adminBalance =
      input.fromAdmin && status === "successful"
        ? +Math.max(0, state.adminBalance - amount).toFixed(2)
        : state.adminBalance;

    const tx: AppTransaction = {
      id: uid("tx"),
      userId: input.userId,
      merchant: input.fromAdmin ? "Admin funding" : "External top-up",
      category: "income",
      amount,
      status,
      kind: "credit",
      createdAt: Date.now(),
      deleted: false,
      source: "admin",
      note: input.note,
    };

    state = { ...state, users, adminBalance, transactions: [tx, ...state.transactions] };
    emit();
    const funded = users.find((u) => u.id === input.userId);
    if (funded) pushUser(funded);
    pushTx(tx);
    pushAdminBalance(adminBalance);
  },

  fundAdmin(amount: number) {
    const adminBalance = +(state.adminBalance + Math.max(0, amount)).toFixed(2);
    state = { ...state, adminBalance };
    emit();
    pushAdminBalance(adminBalance);
  },

  executeInternalTransfer(input: {
    senderId: string;
    recipientId: string;
    amount: number;
    note?: string;
    beneficiary: Beneficiary;
  }) {
    // BUG FIX: prevent self-transfer
    if (input.senderId === input.recipientId) return;

    const sender = state.users.find((u) => u.id === input.senderId);
    const recipient = state.users.find((u) => u.id === input.recipientId);

    // BUG FIX: re-check frozen and balance at execution time
    if (!sender || !recipient) return;
    if (sender.status === "frozen") return;

    const amt = +Math.min(input.amount, sender.balance).toFixed(2);
    if (amt <= 0) return;

    const now = Date.now();
    const debitTx: AppTransaction = {
      id: uid("tx"),
      userId: input.senderId,
      merchant: input.beneficiary.accountName,
      category: "transfer",
      amount: -amt,
      status: "successful",
      kind: "debit",
      note: input.note,
      createdAt: now,
      deleted: false,
      source: "user",
      beneficiary: input.beneficiary,
    };

    const creditTx: AppTransaction = {
      id: uid("tx"),
      userId: input.recipientId,
      merchant: `Transfer from ${sender.name}`,
      category: "transfer",
      amount: amt,
      status: "successful",
      kind: "credit",
      note: input.note,
      createdAt: now + 1, // +1ms so credit sorts after debit
      deleted: false,
      source: "user",
      beneficiary: sender.beneficiary,
    };

    const users = state.users.map((u) => {
      if (u.id === input.senderId) return { ...u, balance: +(u.balance - amt).toFixed(2) };
      if (u.id === input.recipientId) return { ...u, balance: +(u.balance + amt).toFixed(2) };
      return u;
    });

    state = { ...state, users, transactions: [debitTx, creditTx, ...state.transactions] };
    emit();

    const updatedSender = users.find((u) => u.id === input.senderId);
    const updatedRecipient = users.find((u) => u.id === input.recipientId);
    if (updatedSender) pushUser(updatedSender);
    if (updatedRecipient) pushUser(updatedRecipient);
    pushTx(debitTx);
    pushTx(creditTx);

    return debitTx;
  },

  setTransactionStatus(txId: string, next: TxStatus) {
    const tx = state.transactions.find((t) => t.id === txId);
    if (!tx || tx.status === next) return;

    // Adjust balance only when transitioning to/from successful
    const wasSuccessful = tx.status === "successful";
    const willBeSuccessful = next === "successful";
    let users = state.users;

    if (wasSuccessful !== willBeSuccessful) {
      users = state.users.map((u) => {
        if (u.id !== tx.userId) return u;
        // willBeSuccessful: apply amount; wasSuccessful: reverse it
        const delta = willBeSuccessful ? tx.amount : -tx.amount;
        return { ...u, balance: +(u.balance + delta).toFixed(2) };
      });
    }

    const transactions = state.transactions.map((t) =>
      t.id === txId ? { ...t, status: next } : t
    );
    state = { ...state, users, transactions };
    emit();

    const updated = transactions.find((t) => t.id === txId);
    if (updated) pushTx(updated);
    const affected = users.find((u) => u.id === tx.userId);
    if (affected) pushUser(affected);
  },

  softDeleteTransaction(txId: string) {
    const transactions = state.transactions.map((t) =>
      t.id === txId ? { ...t, deleted: true } : t
    );
    state = { ...state, transactions };
    emit();
    const t = transactions.find((x) => x.id === txId);
    if (t) pushTx(t);
  },

  restoreTransaction(txId: string) {
    const transactions = state.transactions.map((t) =>
      t.id === txId ? { ...t, deleted: false } : t
    );
    state = { ...state, transactions };
    emit();
    const t = transactions.find((x) => x.id === txId);
    if (t) pushTx(t);
  },

  setUserStatus(userId: string, next: "active" | "frozen") {
    const users = state.users.map((u) =>
      u.id === userId ? { ...u, status: next } : u
    );
    state = { ...state, users };
    emit();
    const u = users.find((x) => x.id === userId);
    if (u) pushUser(u);
  },

  /**
   * Record a failed transfer attempt — no balance change, no recipient
   * credited. Used so the sender's transaction history and receipt show
   * the failure (e.g. unrecognised beneficiary, blocked account).
   */
  recordFailedTransfer(input: {
    senderId: string;
    amount: number;
    note?: string;
    beneficiary: Beneficiary;
    reason?: string;
  }): AppTransaction {
    const tx: AppTransaction = {
      id: uid("tx"),
      userId: input.senderId,
      merchant: input.beneficiary.accountName || "Unknown beneficiary",
      category: "transfer",
      amount: -Math.abs(input.amount),
      status: "failed",
      kind: "debit",
      note: input.note ?? input.reason,
      createdAt: Date.now(),
      deleted: false,
      source: "user",
      beneficiary: input.beneficiary,
    };
    state = { ...state, transactions: [tx, ...state.transactions] };
    emit();
    pushTx(tx);
    return tx;
  },

  /**
   * Permanently delete a user account. Their transaction history is kept
   * (for audit purposes) but any UI referencing this userId should fall
   * back to "Deleted user" — see `userDisplayName()`.
   */
  async deleteUser(userId: string): Promise<{ ok: boolean; error?: string }> {
    const removedUser = state.users.find((u) => u.id === userId);

    // Remove from local state immediately — UI updates instantly
    const users = state.users.filter((u) => u.id !== userId);
    state = { ...state, users };
    emit();

    if (!hasSupabase) return { ok: true };

    const { error } = await supabase.from("santander_users").delete().eq("id", userId);

    if (error) {
      console.error("[Store] Failed to delete user from Supabase:", error.message);
      // Roll back — the delete didn't actually take effect server-side,
      // so re-add the user locally to avoid a confusing inconsistent state.
      if (removedUser && !state.users.some((u) => u.id === userId)) {
        state = { ...state, users: [removedUser, ...state.users] };
        emit();
      }
      return { ok: false, error: error.message };
    }

    return { ok: true };
  },

  reset() {
    state = seed();
    hydrateRan = false;
    emit();
  },
};
