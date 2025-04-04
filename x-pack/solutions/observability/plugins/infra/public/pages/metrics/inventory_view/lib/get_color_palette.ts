/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  euiPaletteCool,
  euiPaletteForStatus,
  euiPaletteForTemperature,
  euiPaletteRed,
  euiPaletteGreen,
  euiPaletteWarm,
} from '@elastic/eui';
import type { InventoryColorPalette } from '../../../../common/inventory/types';

const createColorPalette = (name: InventoryColorPalette = 'cool', steps: number = 10) => {
  switch (name) {
    case 'temperature':
      return euiPaletteForTemperature(steps);
    case 'status':
      return euiPaletteForStatus(steps);
    case 'warm':
      return euiPaletteWarm(steps);
    case 'positive':
      return euiPaletteGreen(steps);
    case 'negative':
      return euiPaletteRed(steps);
    default:
      return euiPaletteCool(steps);
  }
};

export const getColorPalette = (
  name: InventoryColorPalette = 'cool',
  steps: number = 10,
  reverse: boolean = false
) => {
  return reverse ? createColorPalette(name, steps).reverse() : createColorPalette(name, steps);
};
