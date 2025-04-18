/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ReactNode } from 'react';
import React from 'react';
import { EuiText, EuiPanel, EuiHealth, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

import type { ActionStatus } from '../../../../../types';

import { UpgradeInProgressActivityItem } from './upgrade_in_progress_activity_item';
import { ActivityItem } from './activity_item';

export const ActivitySection: React.FunctionComponent<{
  title: ReactNode;
  actions: ActionStatus[];
  abortUpgrade: (action: ActionStatus) => Promise<void>;
  onClickViewAgents: (action: ActionStatus) => void;
  onClickManageAutoUpgradeAgents: (action: ActionStatus) => void;
}> = ({ title, actions, abortUpgrade, onClickViewAgents, onClickManageAutoUpgradeAgents }) => {
  return (
    <>
      <EuiPanel color="subdued" hasBorder={true} borderRadius="none">
        <EuiText>
          <EuiFlexGroup gutterSize="xs" alignItems="center">
            {actions.some((action) => action.status === 'IN_PROGRESS') && (
              <EuiFlexItem grow={false}>
                <EuiHealth color="success" />
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={false}>
              <b>{title}</b>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiText>
      </EuiPanel>
      {actions.map((currentAction) =>
        currentAction.type === 'UPGRADE' && currentAction.status === 'IN_PROGRESS' ? (
          <UpgradeInProgressActivityItem
            action={currentAction}
            abortUpgrade={abortUpgrade}
            key={currentAction.actionId}
            onClickViewAgents={onClickViewAgents}
            onClickManageAutoUpgradeAgents={onClickManageAutoUpgradeAgents}
          />
        ) : (
          <ActivityItem
            action={currentAction}
            key={currentAction.actionId}
            onClickViewAgents={onClickViewAgents}
            onClickManageAutoUpgradeAgents={onClickManageAutoUpgradeAgents}
          />
        )
      )}
    </>
  );
};
