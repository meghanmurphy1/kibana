/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { parse } from '..';

describe('WHERE', () => {
  describe('correctly formatted', () => {
    it('example from documentation', () => {
      const text = `
        FROM employees
        | KEEP first_name, last_name, still_hired
        | WHERE still_hired == true
        `;
      const { ast, errors } = parse(text);

      expect(errors.length).toBe(0);
      expect(ast).toMatchObject([
        {},
        {},
        {
          type: 'command',
          name: 'where',
          args: [
            {
              type: 'function',
              name: '==',
            },
          ],
        },
      ]);
    });
  });
});
