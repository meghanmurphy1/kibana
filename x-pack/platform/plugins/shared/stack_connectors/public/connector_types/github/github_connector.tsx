/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type {
  ActionConnectorFieldsProps,
  ConfigFieldSchema,
  SecretsFieldSchema,
} from '@kbn/triggers-actions-ui-plugin/public';
import { SimpleConnectorForm } from '@kbn/triggers-actions-ui-plugin/public';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiLink } from '@elastic/eui';
import { DEFAULT_GITHUB_URL } from '../../../common/github/constants';
import * as i18n from './translations';

const configFormSchema: ConfigFieldSchema[] = [
  {
    id: 'apiUrl',
    label: i18n.URL_LABEL,
    isUrlField: true,
    defaultValue: DEFAULT_GITHUB_URL,
    helpText: (
      <FormattedMessage
        defaultMessage="The GitHub API endpoint URL. Defaults to {defaultUrl}."
        id="xpack.stackConnectors.github.apiUrlHelpText"
        values={{
          defaultUrl: <strong>{DEFAULT_GITHUB_URL}</strong>,
        }}
      />
    ),
  },
];

const secretsFormSchema: SecretsFieldSchema[] = [
  {
    id: 'token',
    label: i18n.TOKEN_LABEL,
    isPasswordField: true,
    helpText: (
      <FormattedMessage
        defaultMessage="A GitHub personal access token with repo scope. Create one at {link}."
        id="xpack.stackConnectors.github.tokenHelpText"
        values={{
          link: (
            <EuiLink
              data-test-subj="github-token-doc"
              href="https://github.com/settings/tokens"
              target="_blank"
            >
              https://github.com/settings/tokens
            </EuiLink>
          ),
        }}
      />
    ),
  },
];

const GitHubActionConnectorFields: React.FunctionComponent<ActionConnectorFieldsProps> = ({
  readOnly,
  isEdit,
}) => (
  <SimpleConnectorForm
    isEdit={isEdit}
    readOnly={readOnly}
    configFormSchema={configFormSchema}
    secretsFormSchema={secretsFormSchema}
  />
);

// eslint-disable-next-line import/no-default-export
export { GitHubActionConnectorFields as default };

