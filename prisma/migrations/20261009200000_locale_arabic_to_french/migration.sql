-- Arabic is no longer a supported language (fr, en, nl). Any company still on it falls back to the default, French.
UPDATE "tenants" SET "locale" = 'fr' WHERE "locale" = 'ar';
