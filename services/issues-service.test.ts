import { describe, expect, test } from 'bun:test';
import { buildIssuePageQuery } from './issues-service';

describe('buildIssuePageQuery', () => {
  test('maps paging and filters to the backend query keys', () => {
    expect(
      buildIssuePageQuery({
        page: 2,
        size: 20,
        projectId: 7,
        search: 'crack',
        status: 'open',
        type: 'safety',
      })
    ).toEqual({
      pageNo: 2,
      pageSize: 20,
      projectId: 7,
      search: 'crack',
      status: 'open',
      type: 'safety',
    });
  });

  test('forwards assigneeId when set', () => {
    expect(buildIssuePageQuery({ assigneeId: 42 })).toEqual({ assigneeId: 42 });
  });

  test('forwards creatorId when set', () => {
    expect(buildIssuePageQuery({ creatorId: 99 })).toEqual({ creatorId: 99 });
  });

  test('omits employee filters and empty strings when unset', () => {
    expect(buildIssuePageQuery({ page: 0, size: 10, search: '' })).toEqual({
      pageNo: 0,
      pageSize: 10,
    });
  });
});
