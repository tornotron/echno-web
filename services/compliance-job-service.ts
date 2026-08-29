import { api, ApiError, logger } from '@tornotron/echno-core';
import {
  parseComplianceGenerationJob,
  type ComplianceGenerationJob,
} from '@/types/compliance-job';

/**
 * The compliance generation job endpoints.
 *
 * These replaced `POST /compliance/regenerate`, which ran the model inside the
 * request and therefore died at the edge timeout once a jurisdiction had about
 * forty rules. None of the calls here wait for a model: starting a run costs an
 * insert and reading one costs a single-row select, so they all take the shared
 * client's ordinary budget rather than a stretched one of their own.
 */
const COMPLIANCE_JOBS_PATH = '/inspections/web/compliance/jobs';

function read(raw: unknown): ComplianceGenerationJob {
  try {
    return parseComplianceGenerationJob(raw);
  } catch (error) {
    logger.error('Failed to read a compliance generation job:', error);
    throw new ApiError(
      'The compliance analysis could not be read. Reload the page to see where it got to.',
      422
    );
  }
}

export const complianceJobService = {
  /**
   * Starts a run for a project, or joins the one already in flight for it.
   *
   * The backend enforces one active run per project with a partial unique index
   * and answers a second request with the run that already exists, so a caller
   * gets a job back either way and never has a collision to handle.
   */
  async start(projectId: number): Promise<ComplianceGenerationJob> {
    return read(
      await api.post<unknown>(COMPLIANCE_JOBS_PATH, {}, { projectId })
    );
  },

  /** Reads one run. This is what polling calls. */
  async getById(jobId: string): Promise<ComplianceGenerationJob> {
    return read(
      await api.get<unknown>(
        `${COMPLIANCE_JOBS_PATH}/${encodeURIComponent(jobId)}`
      )
    );
  },

  /**
   * The most recent run for a project, whatever state it is in, or null when the
   * project has never had one.
   *
   * This is how a page reloaded mid-run finds the run again: the job id it was
   * holding went with the tab. A project that has never been generated for is
   * answered with a 404, which is an absence rather than a failure and is read
   * as one here.
   */
  async getLatestForProject(
    projectId: number
  ): Promise<ComplianceGenerationJob | null> {
    try {
      return read(await api.get<unknown>(COMPLIANCE_JOBS_PATH, { projectId }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
