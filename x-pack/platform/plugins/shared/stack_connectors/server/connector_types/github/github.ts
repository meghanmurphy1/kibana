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
import { z } from '@kbn/zod';
import { SUB_ACTION } from '../../../common/github/constants';
import {
  SearchIssuesActionParamsSchema,
  SearchIssuesActionResponseSchema,
  GitHubIssueSchema,
  GetReadmeActionParamsSchema,
  GetReadmeActionResponseSchema,
} from '../../../common/github/schema';
import type {
  Config,
  Secrets,
  SearchIssuesActionParams,
  SearchIssuesActionResponse,
  GetReadmeActionParams,
  GetReadmeActionResponse,
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
      name: SUB_ACTION.SEARCH_ISSUES,
      method: 'searchIssues',
      schema: SearchIssuesActionParamsSchema,
    });
    this.registerSubAction({
      name: SUB_ACTION.GET_README,
      method: 'getREADME',
      schema: GetReadmeActionParamsSchema,
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
      const errorMessage = error.response?.data?.message || '';
      // Check for SAML enforcement error
      if (errorMessage.includes('SAML enforcement') || errorMessage.includes('organization SAML')) {
        return `Forbidden API Error: ${errorMessage} To authorize your OAuth token for this organization, visit https://github.com/settings/tokens and authorize the token for the organization.`;
      }
      return `Forbidden API Error${
        errorMessage ? `: ${errorMessage}` : ''
      }. Your token may not have the required permissions.`;
    }
    return `API Error: ${error.response?.statusText}${
      error.response?.data?.message ? ` - ${error.response.data.message}` : ''
    }`;
  }

  /**
   * Searches for issues in a GitHub repository
   * @param params Parameters for searching issues
   * @param connectorUsageCollector Usage collector for tracking
   * @returns List of issues
   */
  public async searchIssues(
    {
      owner,
      repo,
      state,
      query,
    }: SearchIssuesActionParams,
    connectorUsageCollector: ConnectorUsageCollector
  ): Promise<SearchIssuesActionResponse> {
    // GitHub Search API returns an object with items array, total_count, and incomplete_results
    const githubSearchResponseSchema = z.object({
      total_count: z.number(),
      incomplete_results: z.boolean(),
      items: z.array(GitHubIssueSchema),
    });

    // Build the search query - include state in the query string if not 'all'
    let searchQuery = `repo:${owner}/${repo} is:issue`;
    if (state && state !== 'all') {
      searchQuery += ` state:${state}`;
    }
    if (query) {
      searchQuery += ` ${query}`;
    }

    const response = await this.request<z.infer<typeof githubSearchResponseSchema>>(
      {
        url: `${this.apiUrl}/search/issues`,
        method: 'get',
        params: {
          q: searchQuery,
        },
        headers: {
          Authorization: `Bearer ${this.secrets.token}`,
        },
        responseSchema: githubSearchResponseSchema,
      },
      connectorUsageCollector
    );

    // Transform the GitHub API response to match our response schema
    const transformedResponse: SearchIssuesActionResponse = {
      issues: response.data.items,
      total_count: response.data.total_count,
    };

    // Validate the transformed response
    return SearchIssuesActionResponseSchema.parse(transformedResponse);
  }

  /**
   * Gets the README file from a GitHub repository
   * @param params Parameters for getting the README
   * @param connectorUsageCollector Usage collector for tracking
   * @returns README file content and metadata
   */
  public async getREADME(
    {
      owner,
      repo,
      ref,
    }: GetReadmeActionParams,
    connectorUsageCollector: ConnectorUsageCollector
  ): Promise<GetReadmeActionResponse> {
    // GitHub API returns content as base64-encoded string
    const apiResponseSchema = GetReadmeActionResponseSchema.extend({
      content: z.string(), // Base64-encoded content from API
    });
    
    const response = await this.request<z.infer<typeof apiResponseSchema>>(
      {
        url: `${this.apiUrl}/repos/${owner}/${repo}/contents/README.md`,
        method: 'get',
        params: ref ? { ref } : undefined,
        headers: {
          // Gets a 403 when trying to use this token for a public repo and the Github OAuth app doesn't have access from elastic.
          // Authorization: `Bearer ${this.secrets.token}`,
          Accept: 'application/vnd.github.v3+json'
        },
        responseSchema: apiResponseSchema,
      },
      connectorUsageCollector
    );

    // Decode base64 content to UTF-8 string
    const decodedContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
    
    return GetReadmeActionResponseSchema.parse({
      ...response.data,
      content: decodedContent,
    });
  }
}

