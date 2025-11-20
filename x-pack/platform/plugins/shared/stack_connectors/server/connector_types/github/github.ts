/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ServiceParams } from '@kbn/actions-plugin/server';
import { SubActionConnector } from '@kbn/actions-plugin/server';
import type { ConnectorUsageCollector } from '@kbn/actions-plugin/server/types';
import type { AxiosError } from 'axios';
import { SUB_ACTION } from '../../../common/github/constants';
import {
  ListRepositoriesActionParamsSchema,
  ListRepositoriesActionResponseSchema,
} from '../../../common/github/schema';
import type {
  Config,
  Secrets,
  ListRepositoriesActionParams,
  ListRepositoriesActionResponse,
  GitHubRepository,
} from '../../../common/github/types';

export class GitHubConnector extends SubActionConnector<Config, Secrets> {
  private apiUrl: string;

  constructor(params: ServiceParams<Config, Secrets>) {
    super(params);

    this.apiUrl = this.config.apiUrl || 'https://api.github.com';
    this.registerSubActions();
  }

  private registerSubActions() {
    this.registerSubAction({
      name: SUB_ACTION.LIST_REPOSITORIES,
      method: 'listRepositories',
      schema: ListRepositoriesActionParamsSchema,
    });
  }

  protected getResponseErrorMessage(error: AxiosError<{ message?: string }>): string {
    if (!error.response?.status) {
      return `Unexpected API Error: ${error.code ?? ''} - ${error.message ?? 'Unknown error'}`;
    }
    if (error.response.status === 401) {
      return `Unauthorized API Error${
        error.response?.data?.message ? `: ${error.response.data.message}` : ''
      }. Please check your personal access token.`;
    }
    if (error.response.status === 403) {
      return `Forbidden API Error${
        error.response?.data?.message ? `: ${error.response.data.message}` : ''
      }. Your token may not have the required permissions.`;
    }
    return `API Error: ${error.response?.statusText}${
      error.response?.data?.message ? ` - ${error.response.data.message}` : ''
    }`;
  }

  /**
   * Lists repositories for the authenticated user
   * @param params Parameters for listing repositories
   * @param connectorUsageCollector Usage collector for tracking
   * @returns List of repositories
   */
  public async listRepositories(
    {
      type = 'all',
      sort = 'full_name',
      direction = 'asc',
      perPage = 30,
      page = 1,
    }: ListRepositoriesActionParams,
    connectorUsageCollector: ConnectorUsageCollector
  ): Promise<ListRepositoriesActionResponse> {
    const response = await this.request<GitHubRepository[]>(
      {
        url: `${this.apiUrl}/user/repos`,
        method: 'get',
        params: {
          type,
          sort,
          direction,
          per_page: perPage,
          page,
        },
        headers: {
          'Notion-Version': '2025-09-03',
          Authorization: `Bearer ${this.secrets.token}`,
        },
        responseSchema: ListRepositoriesActionResponseSchema,
      },
      connectorUsageCollector
    );

    const repositories = Array.isArray(response.data) ? response.data : [];
    return {
      repositories,
      total_count: repositories.length,
    };
  }
}

