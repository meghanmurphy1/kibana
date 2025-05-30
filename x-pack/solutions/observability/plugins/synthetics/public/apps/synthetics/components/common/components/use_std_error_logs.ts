/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createEsParams, useEsSearch } from '@kbn/observability-shared-plugin/public';
import { Ping } from '../../../../../../common/runtime_types';
import { SYNTHETICS_INDEX_PATTERN } from '../../../../../../common/constants';

export const useStdErrorLogs = ({ checkGroup }: { checkGroup?: string }) => {
  const { data, loading } = useEsSearch(
    createEsParams({
      index: !checkGroup ? '' : SYNTHETICS_INDEX_PATTERN,
      size: 1000,
      query: {
        bool: {
          filter: [
            {
              terms: {
                'synthetics.type': ['stderr', 'stdout'],
              },
            },
            ...(checkGroup
              ? [
                  {
                    term: {
                      'monitor.check_group': checkGroup,
                    },
                  },
                ]
              : []),
          ],
        },
      },
    }),
    [],
    { name: 'getStdErrLogs' }
  );

  return {
    items: data?.hits.hits.map((hit) => ({ ...(hit._source as Ping), id: hit._id })) ?? [],
    loading,
  };
};
