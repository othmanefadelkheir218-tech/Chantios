import { MyProjectsHandler } from './my-projects.handler';

describe('MyProjectsHandler — the worker sees only projects where they have a task', () => {
  const logger = { debug: jest.fn() };
  const tasks = { findProjectIdsOfAssignee: jest.fn() };
  const projects = { findSummaries: jest.fn() };
  const handler = new MyProjectsHandler(
    logger as never,
    tasks as never,
    projects as never,
  );

  it('asks the projects service for exactly the caller’s project ids', async () => {
    tasks.findProjectIdsOfAssignee.mockResolvedValue([3, 8]);
    projects.findSummaries.mockResolvedValue([{ id: 3, name: 'Villa' }]);

    const out = await handler.execute({ userId: 20 } as never);

    expect(tasks.findProjectIdsOfAssignee).toHaveBeenCalledWith(20);
    expect(projects.findSummaries).toHaveBeenCalledWith([3, 8]);
    expect(out).toEqual([{ id: 3, name: 'Villa' }]);
  });
});
