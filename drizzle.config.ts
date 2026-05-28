import type { Config } from 'drizzle-kit';

export default {
  schema: './database/drizzle.schema.ts',
  out: './database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './database/cobroo.db',
  }
} satisfies Config;
