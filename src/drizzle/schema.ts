import { pgTable, uuid, varchar, integer, timestamp, index, boolean, jsonb, pgEnum, date } from 'drizzle-orm/pg-core';

// User Schema
export const userTable = pgTable(
  'user',
  {
    uid: uuid('uid').primaryKey().defaultRandom(),
    full_name: varchar('full_name', { length: 255 }).notNull(),
    mobile_number: varchar('mobile_number', { length: 10 }).notNull().unique(),
    email: varchar('email', { length: 255 }).unique(),
    password: varchar('password', { length: 255 }).notNull(),
    pin: integer().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      uidIndex: index('uidIndex').on(table.uid),
      pinIndex: index('pinIndex').on(table.pin),
    };
  }
);

export const userDetails = pgTable(
  'user_details',
  {
    userId: uuid('userId')
      .references(() => userTable.uid)
      .notNull(),
    id: uuid('id').primaryKey().defaultRandom(),
    wallet_balance: integer(),
    betting: boolean().notNull().default(false),
    transfer: boolean().notNull().default(false),
    active: boolean().notNull().default(false),
    bank_name: varchar('bank_name', { length: 100 }),
    account_holder_name: varchar('account_holder_name', { length: 100 }),
    account_number: integer(),
    ifsc_code: varchar('ifsc_code', { length: 20 }),
    phone_pay_no: varchar('phone_pay_no', { length: 15 }),
    google_pay_no: varchar('google_pay_no', { length: 15 }),
    paytm_pay_no: varchar('paytm_pay_no', { length: 15 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      idIndex: index('idIndex').on(table.id),
    };
  }
);

// Admin Schema
export const adminTable = pgTable(
  'admin',
  {
    aid: uuid('aid').primaryKey().defaultRandom(),
    mobile_number: varchar('mobile_number', { length: 10 }).unique(),
    email: varchar('email', { length: 255 }).unique(),
    password: varchar('password', { length: 255 }).notNull(),
    whatsapp_number: varchar('whatsapp_number', { length: 10 }),
    min_withdrwal_rate: integer(),
    max_withdrwal_rate: integer(),
    min_transfer: integer(),
    max_transfer: integer(),
    account_holder_name: varchar('account_holder_name', { length: 255 }),
    account_number: integer(),
    ifsc_code: varchar('ifsc_code', { length: 255 }),
    txn_upi_id: varchar('txn_upi_id', { length: 255 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      aidIndex: index('aidIndex').on(table.aid),
    };
  }
);

// Market Management
export const market = pgTable(
  'market',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    market_name: varchar('market_name', { length: 100 }).notNull(),
    market_time: jsonb(),
    market_status: boolean().notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      idMIndex: index('idMIndex').on(table.id),
    };
  }
);

export const games = pgTable(
  'games',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    game_name: varchar('game_name', { length: 100 }).notNull(),
    min_game_amount: integer().notNull(),
    max_game_amount: integer().notNull(),
    game_status: boolean().notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      idGIndex: index('idGIndex').on(table.id),
    };
  }
);

export const userBids = pgTable(
  'user_bids',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .references(() => userTable.uid)
      .notNull(),
    marketId: uuid('marketId')
      .references(() => market.id)
      .notNull(),
    gameId: uuid('gameId')
      .references(() => games.id)
      .notNull(),
    bid_number: integer().notNull(),
    bid_amount: integer().notNull(),
    bid_type: varchar('bid_type', { length: 25 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      idUbIndex: index('idUbIndex').on(table.id),
    };
  }
);

export const winData = pgTable(
  'win_data',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    marketId: uuid('marketId')
      .references(() => market.id)
      .notNull(),
    gameId: uuid('gameId')
      .references(() => games.id)
      .notNull(),
    bid_type: varchar('bid_type', { length: 25 }).notNull(),
    result_date: date("result_date").notNull(),
    win_number: integer().notNull(),
    money_settled: boolean().default(false).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      idWinIndex: index('idWinIndex').on(table.id),
    };
  }
);

// Wallet Management
export const transactionStatusEnum = pgEnum('transaction_status', ['Approved', 'Rejected', 'Pending']);
export const transactionTypesEnum = pgEnum('transaction_types', [
  'Money add request',
  'Money withdraw request',
  'Bid Placed',
  'Winnings',
]);

export const userTransactions = pgTable(
  'user_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .references(() => userTable.uid)
      .notNull(),
    marketId: uuid('marketId').references(() => market.id),
    gameId: uuid('gameId').references(() => games.id),
    txn_id: varchar('txn_id', { length: 255 }).unique().notNull(),
    txn_type: transactionTypesEnum('txn_type').notNull(),
    amount: integer().notNull(),
    status: transactionStatusEnum('status').notNull().default('Pending'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      idUtIndex: index('idUtIndex').on(table.id),
    };
  }
);
