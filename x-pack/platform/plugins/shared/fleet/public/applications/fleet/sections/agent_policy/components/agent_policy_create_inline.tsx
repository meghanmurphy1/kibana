/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useState } from 'react';
import {
  EuiAccordion,
  EuiButton,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiLink,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import styled from 'styled-components';
import { i18n } from '@kbn/i18n';

import { useSpaceSettingsContext } from '../../../../../hooks/use_space_settings_context';
import type { AgentPolicy, NewAgentPolicy } from '../../../types';
import { useStartServices, useAuthz, sendCreateAgentPolicyForRq } from '../../../hooks';
import { generateNewAgentPolicyWithDefaults } from '../../../../../../common/services/generate_new_agent_policy';

import { agentPolicyFormValidation } from '.';
import { AgentPolicyAdvancedOptionsContent } from './agent_policy_advanced_fields';
import { AgentPolicyFormSystemMonitoringCheckbox } from './agent_policy_system_monitoring_field';

const StyledEuiAccordion = styled(EuiAccordion)`
  .ingest-active-button {
    color: ${(props) => props.theme.eui.euiColorPrimary};
  }
`;

interface Props {
  updateAgentPolicy: (u: AgentPolicy | null, errorMessage?: JSX.Element) => void;
  isFleetServerPolicy?: boolean;
  agentPolicyName: string;
}

export const AgentPolicyCreateInlineForm: React.FunctionComponent<Props> = ({
  updateAgentPolicy,
  isFleetServerPolicy,
  agentPolicyName,
}) => {
  const { docLinks, notifications } = useStartServices();
  const authz = useAuthz();
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

  const [withSysMonitoring, setWithSysMonitoring] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState(false);
  const isDisabled = !authz.fleet.allAgentPolicies || isLoading;
  const spaceSettings = useSpaceSettingsContext();

  const [newAgentPolicy, setNewAgentPolicy] = useState<NewAgentPolicy>(
    generateNewAgentPolicyWithDefaults({
      name: agentPolicyName,
      has_fleet_server: isFleetServerPolicy,
      namespace: spaceSettings.defaultNamespace,
    })
  );

  const updateNewAgentPolicy = useCallback(
    (updatedFields: Partial<NewAgentPolicy>) => {
      setNewAgentPolicy({
        ...newAgentPolicy,
        ...updatedFields,
      });
    },
    [setNewAgentPolicy, newAgentPolicy]
  );

  const validation = agentPolicyFormValidation(newAgentPolicy, {
    allowedNamespacePrefixes: spaceSettings.allowedNamespacePrefixes,
  });

  const createAgentPolicy = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await sendCreateAgentPolicyForRq(newAgentPolicy, { withSysMonitoring });

      updateAgentPolicy(data.item);
    } catch (e) {
      notifications.toasts.addError(e, {
        title: i18n.translate('xpack.fleet.agentPolicyCreateInline.errorTitle', {
          defaultMessage: 'Error creating agent policy',
        }),
      });
      updateAgentPolicy(null, mapError(e));
    } finally {
      setIsLoading(false);
    }
  }, [newAgentPolicy, withSysMonitoring, updateAgentPolicy, notifications.toasts]);

  function mapError(e: { statusCode: number }): JSX.Element | undefined {
    switch (e.statusCode) {
      case 409:
        return (
          <FormattedMessage
            id="xpack.fleet.agentPolicyCreation.errorMessage"
            defaultMessage="An agent policy already exists with this name."
          />
        );
    }
  }

  return (
    <EuiForm>
      <EuiText>
        {isFleetServerPolicy ? (
          <FormattedMessage
            id="xpack.fleet.agentPolicyForm.createAgentPolicyFleetServer"
            defaultMessage="Fleet Server runs on Elastic Agent, and agents are enrolled in agent policies which represent hosts. We'll need to create a dedicated agent policy for Fleet Server to run on dedicated hosts."
          />
        ) : (
          <FormattedMessage
            id="xpack.fleet.agentPolicyForm.createAgentPolicyTypeOfHosts"
            defaultMessage="Settings for the monitored host are configured in the {agentPolicy}. Create a new agent policy to get started."
            values={{
              agentPolicy: (
                <EuiLink href={docLinks.links.fleet.agentPolicy} target="_blank">
                  <FormattedMessage
                    id="xpack.fleet.agentPolicyForm.createAgentPolicyDocLink"
                    defaultMessage="agent policy"
                  />
                </EuiLink>
              ),
            }}
          />
        )}
      </EuiText>
      <EuiSpacer size="m" />
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow
            fullWidth
            key="name"
            error={touchedFields.name && validation.name ? validation.name : null}
          >
            <EuiFieldText
              fullWidth
              value={newAgentPolicy.name}
              disabled={isDisabled}
              onChange={(e) => updateNewAgentPolicy({ name: e.target.value })}
              isInvalid={Boolean(touchedFields.name && validation.name)}
              onBlur={() => setTouchedFields({ ...touchedFields, name: true })}
              placeholder={i18n.translate('xpack.fleet.agentPolicyForm.nameFieldPlaceholder', {
                defaultMessage: 'Choose a name',
              })}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            color="primary"
            disabled={!newAgentPolicy.name}
            onClick={() => createAgentPolicy()}
            isLoading={isLoading}
            isDisabled={isDisabled}
            data-test-subj={isFleetServerPolicy ? 'createFleetServerPolicyBtn' : 'createPolicyBtn'}
          >
            <FormattedMessage
              id="xpack.fleet.agentPolicyForm.createAgentPolicyText"
              defaultMessage="Create policy"
            />
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <AgentPolicyFormSystemMonitoringCheckbox
        isDisabled={isDisabled}
        withSysMonitoring={withSysMonitoring}
        updateSysMonitoring={(value) => setWithSysMonitoring(value)}
      />

      <>
        <EuiSpacer size="m" />
        <StyledEuiAccordion
          id="advancedOptionsJustChanged"
          data-test-subj="advancedOptionsButton"
          isDisabled={isDisabled}
          buttonContent={
            <FormattedMessage
              id="xpack.fleet.agentPolicyForm.advancedOptionsToggleLabel"
              defaultMessage="Advanced options"
            />
          }
          buttonClassName={!isDisabled ? 'ingest-active-button' : undefined}
        >
          <EuiSpacer size="m" />
          <AgentPolicyAdvancedOptionsContent
            agentPolicy={newAgentPolicy}
            updateAgentPolicy={updateNewAgentPolicy}
            validation={validation}
          />
        </StyledEuiAccordion>
      </>
    </EuiForm>
  );
};
