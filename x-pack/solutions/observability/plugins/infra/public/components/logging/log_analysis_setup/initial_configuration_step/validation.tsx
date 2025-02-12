/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as rt from 'io-ts';
import type { ValidationIndicesError } from '../../../../../common/http_api';
import { validationIndicesErrorRT } from '../../../../../common/http_api';
import type { DatasetFilter } from '../../../../../common/log_analysis';

export type { ValidationIndicesError };
export { validationIndicesErrorRT };

export const timeRangeValidationErrorRT = rt.strict({
  error: rt.literal('INVALID_TIME_RANGE'),
});

export type TimeRangeValidationError = rt.TypeOf<typeof timeRangeValidationErrorRT>;

export type ValidationUIError =
  | ValidationIndicesError
  | { error: 'NETWORK_ERROR' }
  | { error: 'TOO_FEW_SELECTED_INDICES' }
  | TimeRangeValidationError;

interface ValidAvailableIndex {
  validity: 'valid';
  name: string;
  isSelected: boolean;
  availableDatasets: string[];
  datasetFilter: DatasetFilter;
}

interface InvalidAvailableIndex {
  validity: 'invalid';
  name: string;
  errors: ValidationIndicesError[];
}

interface UnvalidatedAvailableIndex {
  validity: 'unknown';
  name: string;
}

export type AvailableIndex =
  | ValidAvailableIndex
  | InvalidAvailableIndex
  | UnvalidatedAvailableIndex;
