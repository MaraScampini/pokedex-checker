# Binder Dex

Tracks which Pokémon we already have in our binders. Phone-first checklist
of every Pokémon (Gen I–IX) with regional forms after their base form.

Nuxt 4 (client-rendered) on Cloudflare Workers, with a D1 database and a
single shared password.

## Local development

```sh
npm install
cp .dev.vars.example .dev.vars        # set APP_PASSWORD
npm run db:migrate:local              # creates the table and loads all Pokémon
npm run dev
```

`npm run preview` builds and runs the real Cloudflare worker locally with
`wrangler dev`.

## First deploy

1. Create the database and copy its id into `wrangler.toml` (`database_id`):
   ```sh
   npx wrangler d1 create pokedex
   ```
2. Load the schema and Pokémon list into it:
   ```sh
   npm run db:migrate:remote
   ```
3. Push the repo to GitHub and create a Worker from it in the Cloudflare
   dashboard (Workers & Pages → Create → Import a repository). Build command
   `npm run build`, deploy command `npx wrangler deploy`. The Worker name must
   match `name` in `wrangler.toml` (`pokedex-checker`).
4. In the Worker's Settings → Variables and Secrets, add `APP_PASSWORD` as a
   secret, then redeploy.

Changing `APP_PASSWORD` signs everyone out.

## The Pokémon list

`migrations/0002_seed.sql` is generated from PokéAPI by
`npm run seed:build`. It only matters for a fresh database: once the site is
live, edit the list from the Edit list screen. Don't re-run the seed migration
on a live database; it would add every Pokémon a second time.

## Data

One table, `entries`: `name`, `gen`, `position` (order inside the
generation), `dex` (Pokédex number, empty for entries added by hand) and
`owned`.
