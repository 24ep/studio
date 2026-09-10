export type StageMoveDirection = 'up' | 'down';

interface StageOrderRow {
  id: string;
  sort_order: number;
}

interface QueryResult<T> {
  rows: T[];
}

interface StageMoveClient {
  query<T>(queryText: string, values?: readonly unknown[]): Promise<QueryResult<T>>;
}

interface StageMoveSuccess {
  ok: true;
}

interface StageMoveFailure {
  ok: false;
  status: 400 | 404;
  message: string;
}

export type StageMoveResult = StageMoveSuccess | StageMoveFailure;

const ADJACENT_STAGE_CONFIG = {
  up: {
    query: 'SELECT id, sort_order FROM "RecruitmentStage" WHERE sort_order < $1 ORDER BY sort_order DESC LIMIT 1',
    boundaryMessage: 'Stage is already at the top',
  },
  down: {
    query: 'SELECT id, sort_order FROM "RecruitmentStage" WHERE sort_order > $1 ORDER BY sort_order ASC LIMIT 1',
    boundaryMessage: 'Stage is already at the bottom',
  },
} satisfies Record<StageMoveDirection, { query: string; boundaryMessage: string }>;

export async function moveRecruitmentStageInTransaction(
  client: StageMoveClient,
  stageId: string,
  direction: StageMoveDirection,
): Promise<StageMoveResult> {
  const currentStage = await fetchCurrentStage(client, stageId);
  if (!currentStage) {
    return { ok: false, status: 404, message: 'Stage not found' };
  }

  const adjacentStage = await fetchAdjacentStage(client, currentStage.sort_order, direction);
  if (!adjacentStage) {
    return { ok: false, status: 400, message: ADJACENT_STAGE_CONFIG[direction].boundaryMessage };
  }

  await swapStageOrders(client, {
    stageId,
    currentOrder: currentStage.sort_order,
    adjacentStage,
  });

  return { ok: true };
}

async function fetchCurrentStage(client: StageMoveClient, stageId: string): Promise<Pick<StageOrderRow, 'sort_order'> | null> {
  const result = await client.query<Pick<StageOrderRow, 'sort_order'>>(
    'SELECT sort_order FROM "RecruitmentStage" WHERE id = $1',
    [stageId],
  );

  return result.rows[0] ?? null;
}

async function fetchAdjacentStage(
  client: StageMoveClient,
  currentOrder: number,
  direction: StageMoveDirection,
): Promise<StageOrderRow | null> {
  const result = await client.query<StageOrderRow>(ADJACENT_STAGE_CONFIG[direction].query, [currentOrder]);
  return result.rows[0] ?? null;
}

async function swapStageOrders(
  client: StageMoveClient,
  input: { stageId: string; currentOrder: number; adjacentStage: StageOrderRow },
): Promise<void> {
  await client.query('UPDATE "RecruitmentStage" SET sort_order = $1 WHERE id = $2', [
    input.adjacentStage.sort_order,
    input.stageId,
  ]);
  await client.query('UPDATE "RecruitmentStage" SET sort_order = $1 WHERE id = $2', [
    input.currentOrder,
    input.adjacentStage.id,
  ]);
}
