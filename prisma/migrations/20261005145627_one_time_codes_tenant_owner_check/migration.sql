-- Hand-written: adding `tenant_id` to one_time_codes (previous migration) means
-- the "exactly one owner" CHECK must accept it as a third valid owner.
-- See doc/Schema Proposal.md § "Exactly-one-recipient checks".
ALTER TABLE "one_time_codes" DROP CONSTRAINT "chk_code_one_owner";

ALTER TABLE "one_time_codes" ADD CONSTRAINT "chk_code_one_owner"
  CHECK (num_nonnulls("tenant_id", "user_id", "admin_user_id") = 1);
