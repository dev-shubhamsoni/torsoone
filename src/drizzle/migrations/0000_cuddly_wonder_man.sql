CREATE TYPE "public"."transaction_status" AS ENUM('Approved', 'Rejected', 'Pending');--> statement-breakpoint
CREATE TYPE "public"."transaction_types" AS ENUM('Money add request', 'Money withdraw request', 'Bid Placed', 'Winnings');--> statement-breakpoint
CREATE TABLE "admin" (
	"aid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mobile_number" varchar(10),
	"email" varchar(255),
	"password" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_mobile_number_unique" UNIQUE("mobile_number"),
	CONSTRAINT "admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_name" varchar(100) NOT NULL,
	"min_game_amount" integer NOT NULL,
	"max_game_amount" integer NOT NULL,
	"game_status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_name" varchar(100) NOT NULL,
	"market_time" jsonb,
	"market_status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"marketId" uuid NOT NULL,
	"gameId" uuid NOT NULL,
	"bid_number" integer NOT NULL,
	"bid_amount" integer NOT NULL,
	"bid_type" varchar(25) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_details" (
	"userId" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_balance" integer,
	"betting" boolean DEFAULT false NOT NULL,
	"transfer" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"bank_name" varchar(100),
	"account_holder_name" varchar(100),
	"account_number" integer,
	"ifsc_code" varchar(20),
	"phone_pay_no" varchar(15),
	"google_pay_no" varchar(15),
	"paytm_pay_no" varchar(15),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"mobile_number" varchar(10) NOT NULL,
	"email" varchar(255),
	"password" varchar(255) NOT NULL,
	"pin" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_mobile_number_unique" UNIQUE("mobile_number"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"marketId" uuid,
	"gameId" uuid,
	"txn_id" varchar(255) NOT NULL,
	"txn_type" "transaction_types" NOT NULL,
	"amount" integer NOT NULL,
	"status" "transaction_status" DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_transactions_txn_id_unique" UNIQUE("txn_id")
);
--> statement-breakpoint
CREATE TABLE "win_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"marketId" uuid NOT NULL,
	"gameId" uuid NOT NULL,
	"bid_type" varchar(25) NOT NULL,
	"result_date" date NOT NULL,
	"win_number" integer NOT NULL,
	"money_settled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_bids" ADD CONSTRAINT "user_bids_userId_user_uid_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bids" ADD CONSTRAINT "user_bids_marketId_market_id_fk" FOREIGN KEY ("marketId") REFERENCES "public"."market"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bids" ADD CONSTRAINT "user_bids_gameId_games_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_userId_user_uid_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_userId_user_uid_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_marketId_market_id_fk" FOREIGN KEY ("marketId") REFERENCES "public"."market"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_gameId_games_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "win_data" ADD CONSTRAINT "win_data_marketId_market_id_fk" FOREIGN KEY ("marketId") REFERENCES "public"."market"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "win_data" ADD CONSTRAINT "win_data_gameId_games_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aidIndex" ON "admin" USING btree ("aid");--> statement-breakpoint
CREATE INDEX "idGIndex" ON "games" USING btree ("id");--> statement-breakpoint
CREATE INDEX "idMIndex" ON "market" USING btree ("id");--> statement-breakpoint
CREATE INDEX "idUbIndex" ON "user_bids" USING btree ("id");--> statement-breakpoint
CREATE INDEX "idIndex" ON "user_details" USING btree ("id");--> statement-breakpoint
CREATE INDEX "uidIndex" ON "user" USING btree ("uid");--> statement-breakpoint
CREATE INDEX "idUtIndex" ON "user_transactions" USING btree ("id");--> statement-breakpoint
CREATE INDEX "idWinIndex" ON "win_data" USING btree ("id");