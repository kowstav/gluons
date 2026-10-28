import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import {
  createSeed,
  decideAction,
  DemoProvider,
  executeLocal,
  processTask,
  scenarioInput,
} from '../src/index';
test('Postgres migration, atomic projections, revision conflicts and owner isolation', async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'authenticated') $$; grant usage on schema auth to authenticated,anon,service_role; grant execute on all functions in schema auth to authenticated,anon,service_role; create publication supabase_realtime;`,
    );
    // gen_random_uuid is built in; PGlite doesn't package the optional pgcrypto extension.
    const migration = (await readFile('supabase/migrations/001_gluons.sql', 'utf8')).replace(
      'create extension if not exists pgcrypto;',
      '',
    );
    await db.exec(migration);
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    const owner = '11111111-1111-4111-8111-111111111111',
      other = '22222222-2222-4222-8222-222222222222';
    await db.query('insert into auth.users(id) values ($1),($2)', [owner, other]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    await db.exec('set role authenticated');
    const state = await createSeed();
    await db.query('select public.save_workspace($1::jsonb,-1,$2::uuid)', [
      JSON.stringify(state),
      owner,
    ]);
    const tasks = await db.query<{ count: number }>(
      'select count(*)::int as count from public.tasks',
    );
    assert.equal(tasks.rows[0].count, 432);
    const action = state.actions[0];
    decideAction(state, action.id, 'approve', 'owner');
    executeLocal(state, action.id);
    state.revision = 1;
    await db.query('select public.save_workspace($1::jsonb,0,$2::uuid)', [
      JSON.stringify(state),
      owner,
    ]);
    const result = await db.query<{ status: string }>(
      'select status from public.proposed_actions where id=$1',
      [action.id],
    );
    assert.equal(result.rows[0].status, 'simulated');
    await assert.rejects(
      () =>
        db.query('select public.save_workspace($1::jsonb,0,$2::uuid)', [
          JSON.stringify(state),
          owner,
        ]),
      /invalid_revision|revision_conflict/,
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [other]);
    assert.equal((await db.query('select * from public.workspaces')).rows.length, 0);
    assert.equal((await db.query('select * from public.tasks')).rows.length, 0);
    await assert.rejects(
      () =>
        db.query('select public.save_workspace($1::jsonb,1,$2::uuid)', [
          JSON.stringify({ ...state, revision: 2 }),
          owner,
        ]),
      /not_authorized/,
    );
    await assert.rejects(
      () => db.exec("update public.proposed_actions set status='executed'"),
      /permission denied/,
    );
    await db.exec('set role anon');
    await db.exec(
      "insert into public.trial_requests(name,email,business) values ('Test Owner','owner@example.test','Test Cafe')",
    );
    await assert.rejects(() => db.exec('select * from public.trial_requests'), /permission denied/);
  } finally {
    await db.close();
  }
});
