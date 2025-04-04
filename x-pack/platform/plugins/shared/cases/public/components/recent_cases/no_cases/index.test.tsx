/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { readCasesPermissions, TestProviders } from '../../../common/mock';
import { NoCases } from '.';
import type { NoCasesComp } from '.';

jest.mock('../../../common/navigation/hooks');

describe('NoCases', () => {
  const defaultProps: NoCasesComp = {
    recentCasesFilterBy: 'recentlyCreated',
  };
  it('if no cases, a link to create cases will exist', () => {
    render(
      <TestProviders>
        <NoCases {...defaultProps} />
      </TestProviders>
    );
    expect(screen.getByTestId(`no-cases-create-case`)).toHaveAttribute(
      'href',
      '/app/security/cases/create'
    );
  });

  it('displays a message without a link to create a case when the user does not have create permissions', () => {
    render(
      <TestProviders permissions={readCasesPermissions()}>
        <NoCases {...defaultProps} />
      </TestProviders>
    );

    expect(screen.getByTestId(`no-cases-readonly`)).toBeInTheDocument();
    expect(screen.queryByTestId('no-cases-create-case')).not.toBeInTheDocument();
  });

  it('displays correct message when no cases are reported by user', () => {
    render(
      <TestProviders>
        <NoCases recentCasesFilterBy="myRecentlyReported" />
      </TestProviders>
    );
    expect(screen.getByTestId(`no-cases-create-case`)).toBeInTheDocument();
  });

  it('displays correct message when no cases are assigned to user', () => {
    render(
      <TestProviders>
        <NoCases recentCasesFilterBy="myRecentlyAssigned" />
      </TestProviders>
    );
    expect(screen.getByTestId(`no-cases-assigned-to-me`)).toBeInTheDocument();
  });

  it('displays correct message when recently assigned tab is selected and user does not have create permissions', () => {
    render(
      <TestProviders permissions={readCasesPermissions()}>
        <NoCases recentCasesFilterBy="myRecentlyAssigned" />
      </TestProviders>
    );

    expect(screen.getByTestId(`no-cases-assigned-to-me`)).toBeInTheDocument();
    expect(screen.queryByTestId(`no-cases-readonly`)).not.toBeInTheDocument();
    expect(screen.queryByTestId('no-cases-create-case')).not.toBeInTheDocument();
  });
});
