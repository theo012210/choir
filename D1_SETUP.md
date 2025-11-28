# Setting up Cloudflare D1 Database

To make the application work with a real database, you need to create a D1 database on Cloudflare and bind it to your project.

## 1. Create the Database
Run the following command in your terminal:

```bash
npx wrangler d1 create choir-db
```

This will output a `database_id`. Copy this ID.

## 2. Update `wrangler.json`
Open `wrangler.json` and add the `d1_databases` configuration. Replace `YOUR_DATABASE_ID_HERE` with the ID you copied.

```json
{
  "name": "choir-learning-plan",
  "compatibility_date": "2025-11-28",
  "assets": {
    "directory": "./dist"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "choir-db",
      "database_id": "YOUR_DATABASE_ID_HERE"
    }
  ]
}
```

## 3. Initialize the Schema
Run this command to create the tables in your remote database:

```bash
npx wrangler d1 execute choir-db --remote --file=./schema.sql
```

## 4. Local Development (Optional)
To test locally with a local D1 database:
1.  Run `npx wrangler d1 execute choir-db --local --file=./schema.sql`
2.  Start the app with `npx wrangler pages dev dist` (after building) or use `npm run dev` if you proxy requests (advanced).

## 5. Deploy
Deploy your changes:

```bash
npm run build
npx wrangler deploy
```
