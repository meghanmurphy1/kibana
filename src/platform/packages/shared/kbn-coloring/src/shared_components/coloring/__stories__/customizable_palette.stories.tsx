/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { EuiForm } from '@elastic/eui';
import { CustomizablePalette } from '../palette_configuration';
import { getPaletteRegistry } from './palettes';

export default {
  title: 'CustomizablePalette',
  component: CustomizablePalette,
  decorators: [(story: Function) => <EuiForm>{story()}</EuiForm>],
};

export const Default = {
  args: {
    palettes: getPaletteRegistry(),
    activePalette: {
      type: 'palette',
      name: 'default',
      params: {
        steps: 1,
        maxSteps: 10,
        continuity: 'none',
      },
    },
    dataBounds: {
      min: 0,
      max: 100,
    },
    showExtraActions: true,
    showRangeTypeSelector: true,
    disableSwitchingContinuity: false,
    setPalette: () => {},
  },
};
