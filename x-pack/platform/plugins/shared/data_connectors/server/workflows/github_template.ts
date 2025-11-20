/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Creates a workflow template for GitHub
 * @param connectorId - The ID of the GitHub connector
 * @param feature - Optional capability/feature (e.g., 'list_repositories')
 * @returns Workflow YAML template with connector reference
 */
export function createGitHubWorkflowTemplate(connectorId: string, feature?: string): string {
  const workflowName = feature ? `github.${feature}` : 'github';
  return `version: '1'
name: '${workflowName}'
description: 'List GitHub repositories'
enabled: true
triggers:
  - type: 'manual'
inputs:
  - name: type
    type: string
    description: Repository type filter (all, owner, member)
    default: 'all'
  - name: sort
    type: string
    description: Sort field (created, updated, pushed, full_name)
    default: 'full_name'
  - name: direction
    type: string
    description: Sort direction (asc, desc)
    default: 'asc'
steps:
  - name: 'List Repositories'
    type: '.github.listRepositories'
    connector-id: '${connectorId}'
    with:
      type: '{{ inputs.type }}'
      sort: '{{ inputs.sort }}'
      direction: '{{ inputs.direction }}'
      perPage: 30
      page: 1
`;
}

