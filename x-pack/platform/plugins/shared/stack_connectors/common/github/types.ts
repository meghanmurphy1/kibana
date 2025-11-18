/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { z } from '@kbn/zod';
import {
  ConfigSchema,
  SecretsSchema,
  ListRepositoriesActionParamsSchema,
  ListRepositoriesActionResponseSchema,
  GitHubRepositorySchema,
} from './schema';

export type Config = z.infer<typeof ConfigSchema>;
export type Secrets = z.infer<typeof SecretsSchema>;
export type ListRepositoriesActionParams = z.infer<typeof ListRepositoriesActionParamsSchema>;
export type ListRepositoriesActionResponse = {
  repositories: GitHubRepository[];
  total_count?: number;
};
export type GitHubRepository = z.infer<typeof GitHubRepositorySchema>;

