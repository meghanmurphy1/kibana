/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SubActionConnectorType } from '@kbn/actions-plugin/server/sub_action_framework/types';
import { ValidatorType } from '@kbn/actions-plugin/server/sub_action_framework/types';
import { SecurityConnectorFeatureId } from '@kbn/actions-plugin/common';
import { urlAllowListValidator } from '@kbn/actions-plugin/server';
import { GITHUB_CONNECTOR_ID, GITHUB_TITLE } from '../../../common/github/constants';
import { ConfigSchema, SecretsSchema } from '../../../common/github/schema';
import type { Config, Secrets } from '../../../common/github/types';
import { GitHubConnector } from './github';

export const getConnectorType = (): SubActionConnectorType<Config, Secrets> => ({
  id: GITHUB_CONNECTOR_ID,
  name: GITHUB_TITLE,
  getService: (params) => new GitHubConnector(params),
  schema: {
    config: ConfigSchema,
    secrets: SecretsSchema,
  },
  validators: [{ type: ValidatorType.CONFIG, validator: urlAllowListValidator('apiUrl') }],
  supportedFeatureIds: [SecurityConnectorFeatureId],
  minimumLicenseRequired: 'gold' as const,
});

