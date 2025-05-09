/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { i18n } from '@kbn/i18n';
import { EuiInMemoryTable, EuiBasicTableColumn, EuiButton, EuiLink, Search } from '@elastic/eui';

import { PAGINATION_CONFIG } from '../constants';
import type { DeprecationResolutionState, KibanaDeprecationDetails } from './kibana_deprecations';
import { ResolutionTableCell } from './resolution_table_cell';
import { DeprecationBadge } from '../shared';

const i18nTexts = {
  refreshButtonLabel: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.refreshButtonLabel',
    {
      defaultMessage: 'Refresh',
    }
  ),
  statusColumnTitle: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.statusColumnTitle',
    {
      defaultMessage: 'Status',
    }
  ),
  issueColumnTitle: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.issueColumnTitle',
    {
      defaultMessage: 'Issue',
    }
  ),
  typeColumnTitle: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.typeColumnTitle',
    {
      defaultMessage: 'Type',
    }
  ),
  resolutionColumnTitle: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.resolutionColumnTitle',
    {
      defaultMessage: 'Resolution',
    }
  ),
  configDeprecationTypeCellLabel: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.configDeprecationTypeCellLabel',
    {
      defaultMessage: 'Config',
    }
  ),
  featureDeprecationTypeCellLabel: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.featureDeprecationTypeCellLabel',
    {
      defaultMessage: 'Feature',
    }
  ),
  apiDeprecationTypeCellLabel: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.apiDeprecationTypeCellLabel',
    {
      defaultMessage: 'API',
    }
  ),
  unknownDeprecationTypeCellLabel: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.unknownDeprecationTypeCellLabel',
    {
      defaultMessage: 'Uncategorized',
    }
  ),
  typeFilterLabel: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.typeFilterLabel',
    {
      defaultMessage: 'Type',
    }
  ),
  statusFilterLabel: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.statusFilterLabel',
    {
      defaultMessage: 'Status',
    }
  ),
  criticalFilterLabel: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.criticalFilterLabel',
    {
      defaultMessage: 'Critical',
    }
  ),
  warningFilterLabel: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.warningFilterLabel',
    {
      defaultMessage: 'Warning',
    }
  ),
  searchPlaceholderLabel: i18n.translate(
    'xpack.upgradeAssistant.kibanaDeprecations.table.searchPlaceholderLabel',
    {
      defaultMessage: 'Filter',
    }
  ),
};

interface Props {
  deprecations?: KibanaDeprecationDetails[];
  reload: () => void;
  toggleFlyout: (newFlyoutContent?: KibanaDeprecationDetails) => void;
  deprecationResolutionStates: Record<string, DeprecationResolutionState>;
}

export const KibanaDeprecationsTable: React.FunctionComponent<Props> = ({
  deprecations,
  reload,
  toggleFlyout,
  deprecationResolutionStates,
}) => {
  const columns: Array<EuiBasicTableColumn<KibanaDeprecationDetails>> = [
    {
      field: 'level',
      name: i18nTexts.statusColumnTitle,
      width: '5%',
      truncateText: true,
      sortable: true,
      render: (level: KibanaDeprecationDetails['level']) => {
        return <DeprecationBadge level={level} />;
      },
    },
    {
      field: 'title',
      width: '40%',
      name: i18nTexts.issueColumnTitle,
      truncateText: true,
      sortable: true,
      render: (title: KibanaDeprecationDetails['title'], deprecation: KibanaDeprecationDetails) => {
        return (
          <EuiLink
            onClick={() => toggleFlyout(deprecation)}
            data-test-subj="deprecationDetailsLink"
          >
            {title}
          </EuiLink>
        );
      },
    },
    {
      field: 'filterType',
      name: i18nTexts.typeColumnTitle,
      width: '20%',
      truncateText: true,
      sortable: true,
      render: (filterType: KibanaDeprecationDetails['filterType']) => {
        switch (filterType) {
          case 'config':
            return i18nTexts.configDeprecationTypeCellLabel;
          case 'feature':
            return i18nTexts.featureDeprecationTypeCellLabel;
          case 'api':
            return i18nTexts.apiDeprecationTypeCellLabel;
          case 'uncategorized':
          default:
            return i18nTexts.unknownDeprecationTypeCellLabel;
        }
      },
    },
    {
      field: 'correctiveActions',
      name: i18nTexts.resolutionColumnTitle,
      width: '30%',
      truncateText: true,
      sortable: true,
      render: (
        correctiveActions: KibanaDeprecationDetails['correctiveActions'],
        deprecation: KibanaDeprecationDetails
      ) => {
        return (
          <ResolutionTableCell
            deprecationId={deprecation.id}
            isAutomated={Boolean(correctiveActions?.api)}
            canBeMarkedAsResolved={Boolean(correctiveActions?.mark_as_resolved_api)}
            deprecationResolutionState={deprecationResolutionStates[deprecation.id]}
          />
        );
      },
    },
  ];

  const sorting = {
    sort: {
      field: 'level',
      direction: 'asc',
    },
  } as const;

  const searchConfig: Search = {
    filters: [
      {
        type: 'field_value_selection',
        field: 'level',
        name: i18nTexts.statusFilterLabel,
        multiSelect: false,
        options: [
          {
            value: 'critical',
            name: i18nTexts.criticalFilterLabel,
          },
          {
            value: 'warning',
            name: i18nTexts.warningFilterLabel,
          },
        ],
      },
      {
        type: 'field_value_selection',
        field: 'filterType',
        name: i18nTexts.typeFilterLabel,
        multiSelect: false,
        options: [
          {
            value: 'config',
            name: i18nTexts.configDeprecationTypeCellLabel,
          },
          {
            value: 'feature',
            name: i18nTexts.featureDeprecationTypeCellLabel,
          },
          {
            value: 'api',
            name: i18nTexts.apiDeprecationTypeCellLabel,
          },
          {
            value: 'uncategorized',
            name: i18nTexts.unknownDeprecationTypeCellLabel,
          },
        ],
      },
    ],
    box: {
      incremental: true,
      placeholder: i18nTexts.searchPlaceholderLabel,
    },
    toolsRight: [
      <EuiButton
        iconType="refresh"
        onClick={reload}
        data-test-subj="refreshButton"
        key="refreshButton"
      >
        {i18nTexts.refreshButtonLabel}
      </EuiButton>,
    ],
  };

  return (
    <EuiInMemoryTable
      items={deprecations || []}
      itemId="name"
      columns={columns}
      search={searchConfig}
      sorting={sorting}
      pagination={PAGINATION_CONFIG}
      rowProps={(deprecation) => ({
        'data-test-subj': 'row',
        onClick: () => {
          toggleFlyout(deprecation);
        },
      })}
      cellProps={(deprecation, field) => ({
        'data-test-subj': `${((field?.name as string) || 'table').toLowerCase()}Cell`,
      })}
      data-test-subj="kibanaDeprecationsTable"
      tableLayout="auto"
    />
  );
};
