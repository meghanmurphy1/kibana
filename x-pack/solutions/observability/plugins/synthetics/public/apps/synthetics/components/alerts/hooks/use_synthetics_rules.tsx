/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useDispatch, useSelector } from 'react-redux';
import React, { useCallback, useEffect, useMemo } from 'react';
import type { CoreStart } from '@kbn/core/public';
import { RuleFormFlyout } from '@kbn/response-ops-rule-form/flyout';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import { i18n } from '@kbn/i18n';
import { selectDynamicSettings } from '../../../state/settings';
import { useSyntheticsSettingsContext } from '../../../contexts';
import {
  selectSyntheticsAlerts,
  selectSyntheticsAlertsLoading,
} from '../../../state/alert_rules/selectors';
import {
  enableDefaultAlertingSilentlyAction,
  getDefaultAlertingAction,
} from '../../../state/alert_rules';
import { SYNTHETICS_TLS_RULE } from '../../../../../../common/constants/synthetics_alerts';
import {
  selectAlertFlyoutVisibility,
  selectIsNewRule,
  selectMonitorListState,
  setAlertFlyoutVisible,
} from '../../../state';
import { ClientPluginsStart } from '../../../../../plugin';

export const useSyntheticsRules = (isOpen: boolean) => {
  const dispatch = useDispatch();

  const defaultRules = useSelector(selectSyntheticsAlerts);
  const loading = useSelector(selectSyntheticsAlertsLoading);
  const alertFlyoutVisible = useSelector(selectAlertFlyoutVisibility);
  const isNewRule = useSelector(selectIsNewRule);
  const { settings } = useSelector(selectDynamicSettings);

  const { canSave } = useSyntheticsSettingsContext();

  const { loaded, data: monitors } = useSelector(selectMonitorListState);

  const hasMonitors = loaded && monitors.absoluteTotal && monitors.absoluteTotal > 0;
  const defaultRulesEnabled =
    settings && (settings?.defaultStatusRuleEnabled || settings?.defaultTLSRuleEnabled);

  const getOrCreateAlerts = useCallback(() => {
    if (canSave) {
      dispatch(enableDefaultAlertingSilentlyAction.get());
    } else {
      dispatch(getDefaultAlertingAction.get());
    }
  }, [canSave, dispatch]);

  useEffect(() => {
    if (hasMonitors && defaultRulesEnabled) {
      if (!defaultRules) {
        // on initial load we prioritize loading the app
        setTimeout(() => {
          getOrCreateAlerts();
        }, 1000);
      } else {
        getOrCreateAlerts();
      }
    }
    // we don't want to run this on defaultRules change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isOpen, hasMonitors, defaultRulesEnabled]);

  const {
    triggersActionsUi: { ruleTypeRegistry, actionTypeRegistry },
    ...plugins
  } = useKibana<CoreStart & ClientPluginsStart>().services;

  const onClose = useMemo(() => () => dispatch(setAlertFlyoutVisible(null)), [dispatch]);

  const EditAlertFlyout = useMemo(() => {
    const initialRule =
      alertFlyoutVisible === SYNTHETICS_TLS_RULE ? defaultRules?.tlsRule : defaultRules?.statusRule;
    if (!initialRule || isNewRule) {
      return null;
    }
    return (
      <RuleFormFlyout
        plugins={{ ...plugins, ruleTypeRegistry, actionTypeRegistry }}
        onCancel={onClose}
        onSubmit={onClose}
        id={initialRule.id}
      />
    );
  }, [
    alertFlyoutVisible,
    defaultRules?.tlsRule,
    defaultRules?.statusRule,
    isNewRule,
    plugins,
    ruleTypeRegistry,
    actionTypeRegistry,
    onClose,
  ]);

  const NewRuleFlyout = useMemo(() => {
    if (!isNewRule || !alertFlyoutVisible) {
      return null;
    }
    return (
      <RuleFormFlyout
        plugins={{ ...plugins, ruleTypeRegistry, actionTypeRegistry }}
        onCancel={onClose}
        onSubmit={onClose}
        ruleTypeId={alertFlyoutVisible}
        initialValues={{
          name:
            alertFlyoutVisible === SYNTHETICS_TLS_RULE
              ? i18n.translate('xpack.synthetics.alerting.defaultRuleName.tls', {
                  defaultMessage: 'Synthetics monitor TLS rule',
                })
              : i18n.translate('xpack.synthetics.alerting.defaultRuleName', {
                  defaultMessage: 'Synthetics monitor status rule',
                }),
        }}
      />
    );
  }, [isNewRule, alertFlyoutVisible, plugins, ruleTypeRegistry, actionTypeRegistry, onClose]);

  return useMemo(
    () => ({ loading, EditAlertFlyout, NewRuleFlyout }),
    [EditAlertFlyout, loading, NewRuleFlyout]
  );
};
