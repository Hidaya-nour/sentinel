import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/integration/setup.ts'],
    // Integration tests share one Postgres DB and mutate shared state (rows).
    // Running them in parallel would cause tests to see each other's leftover
    // data. Force sequential execution instead of chasing race conditions.
    fileParallelism: false,
  },
});
