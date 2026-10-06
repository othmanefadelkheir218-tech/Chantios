-- Chat: make "one membership per person" and "one read row per message per
-- reader" true in the DATABASE.
--
-- The original `UNIQUE (message_id, user_id, client_id)` on message_reads cannot
-- do it: exactly one of user_id / client_id is always NULL, and Postgres treats
-- every NULL as distinct, so (msg 5, user 3, NULL) can be inserted twice.
-- conversation_members had no uniqueness at all. A partial unique index per
-- identity column fixes both, and lets the app use ON CONFLICT DO NOTHING so a
-- double click or two simultaneous requests can never write a duplicate row.

CREATE UNIQUE INDEX "uq_member_user" ON "conversation_members" ("conversation_id", "user_id")
  WHERE "user_id" IS NOT NULL;
CREATE UNIQUE INDEX "uq_member_client" ON "conversation_members" ("conversation_id", "client_id")
  WHERE "client_id" IS NOT NULL;
CREATE UNIQUE INDEX "uq_member_admin" ON "conversation_members" ("conversation_id", "admin_user_id")
  WHERE "admin_user_id" IS NOT NULL;

CREATE UNIQUE INDEX "uq_read_user" ON "message_reads" ("message_id", "user_id")
  WHERE "user_id" IS NOT NULL;
CREATE UNIQUE INDEX "uq_read_client" ON "message_reads" ("message_id", "client_id")
  WHERE "client_id" IS NOT NULL;
