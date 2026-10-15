# Database backup

`chantieros_dump.sql` — full dump (schema + data) of the `chantieros` database.

## Restore on another computer

```bash
docker compose up -d postgres
docker exec -i chantieros_postgres psql -U chantieros -d chantieros < backup/chantieros_dump.sql
```

## Make a new dump

```bash
docker exec chantieros_postgres pg_dump -U chantieros -d chantieros --clean --if-exists --no-owner --no-privileges > backup/chantieros_dump.sql
```

## pgAdmin

`docker compose up -d pgadmin` → http://localhost:5060
The "ChantierOS" server is already listed. Database password: `chantieros_pass`.
