/**
 * The app's ingestion feed: what the pipeline worked on, plus queue totals.
 * Internal error text must not leak, and statuses outside the model's enum
 * (the database holds 'skipped_to_save_quota') must still be counted.
 */
import { IngestionService } from '../../services/IngestionService';

function makeService(jobs: any[], counts: { status: string; count: number; scenarios: number }[]) {
  const repo: any = {
    getFeed: jest.fn().mockResolvedValue(jobs),
    getStatusCounts: jest.fn().mockResolvedValue(counts),
  };
  return { service: new IngestionService(repo, {} as any), repo };
}

const job = (over: Record<string, unknown>) => ({
  job_id: 'j1', game_id: 'sf6', youtube_url: 'https://www.youtube.com/watch?v=abc',
  video_title: 'Daigo vs Tokido', status: 'completed', created_at: new Date('2026-09-20T10:00:00Z'), ...over,
});

describe('IngestionService.getFeed', () => {
  it('totals every status, folding skipped_* variants into skipped', async () => {
    const { service } = makeService([], [
      { status: 'pending', count: 149, scenarios: 0 },
      { status: 'processing', count: 1, scenarios: 0 },
      { status: 'completed', count: 173, scenarios: 2048 },
      { status: 'failed', count: 7, scenarios: 0 },
      { status: 'skipped', count: 2, scenarios: 0 },
      { status: 'skipped_to_save_quota', count: 630, scenarios: 0 },
    ]);

    const res = await service.getFeed();

    expect(res.success).toBe(true);
    expect(res.data!.stats).toEqual({ queued: 149, processing: 1, completed: 173, failed: 7, skipped: 632, scenarios: 2048 });
  });

  it('maps a completed job to a feed item with scenarios and analysis link', async () => {
    const { service } = makeService(
      [job({ scenario_count: 24, analysis_id: 'an-1', channel_name: 'CapcomFighters', processed_at: new Date('2026-09-25T12:00:00Z') })],
      [],
    );

    const item = (await service.getFeed('sf6')).data!.items[0];

    expect(item).toMatchObject({
      job_id: 'j1', title: 'Daigo vs Tokido', channel: 'CapcomFighters', status: 'completed',
      scenarios: 24, analysis_id: 'an-1', platform: 'youtube', at: '2026-09-25T12:00:00.000Z',
    });
  });

  it('reduces failures to a short reason and never exposes the raw error', async () => {
    const raw = 'Service analyzeVideo failed: [GoogleGenerativeAI Error]: 429 quota https://generativelanguage.googleapis.com/secret-path';
    const { service } = makeService([
      job({ job_id: 'a', status: 'failed', error_message: 'Service analyzeVideo failed: patch notes video' }),
      job({ job_id: 'b', status: 'failed', error_message: raw }),
      job({ job_id: 'c', status: 'failed', error_message: 'Video unavailable' }),
      job({ job_id: 'd', status: 'failed', error_message: 'something exploded internally' }),
    ], []);

    const items = (await service.getFeed()).data!.items;

    expect(items.map(i => i.note)).toEqual([
      'Not match footage', 'Analysis limit reached - will retry', 'Video unavailable', 'Analysis failed',
    ]);
    expect(JSON.stringify(items)).not.toMatch(/googleapis|GoogleGenerativeAI|secret-path/);
  });

  it('shows an unrecognised status as skipped and clamps the requested limit', async () => {
    const { service, repo } = makeService([job({ status: 'skipped_to_save_quota' })], []);

    const res = await service.getFeed('sf6', 5000);

    expect(res.data!.items[0].status).toBe('skipped');
    expect(repo.getFeed).toHaveBeenCalledWith('sf6', 100);
  });

  it('returns a failure response instead of throwing when the database errors', async () => {
    const repo: any = { getFeed: jest.fn().mockRejectedValue(new Error('db down')), getStatusCounts: jest.fn() };
    const res = await new IngestionService(repo, {} as any).getFeed();
    expect(res).toEqual({ success: false, error: 'db down' });
  });
});
