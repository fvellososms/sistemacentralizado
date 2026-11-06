CREATE TABLE "rate_limits" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" bigint NOT NULL
);
