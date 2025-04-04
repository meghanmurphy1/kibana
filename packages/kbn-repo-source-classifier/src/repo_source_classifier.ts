/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ImportResolver } from '@kbn/import-resolver';
import type { ModuleGroup, ModuleVisibility } from '@kbn/projects-solutions-groups';
import type { KibanaPackageManifest } from '@kbn/repo-packages/modern/types';
import type { ModuleId } from './module_id';
import type { ModuleType } from './module_type';
import { RANDOM_TEST_FILE_NAMES, TEST_DIR, TEST_TAG } from './config';
import { RepoPath } from './repo_path';
import { inferGroupAttrsFromPath } from './group';

const STATIC_EXTS = new Set(
  'json|woff|woff2|ttf|eot|svg|ico|png|jpg|gif|jpeg|html|md|txt|tmpl|xml'
    .split('|')
    .map((e) => `.${e}`)
);

export class RepoSourceClassifier {
  constructor(private readonly resolver: ImportResolver) {}

  private repoPaths = new Map<string, RepoPath>();
  private ids = new Map<RepoPath, ModuleId>();

  /**
   * Get the cached repo path instance
   */
  private getRepoPath(path: string) {
    const cached = this.repoPaths.get(path);

    if (cached !== undefined) {
      return cached;
    }

    const rp = new RepoPath(path, this.resolver);
    this.repoPaths.set(path, rp);
    return rp;
  }

  /**
   * Is this a "test" file?
   */
  private isTestFile(path: RepoPath) {
    const name = path.getFilename();

    if (name.startsWith('mock_') || RANDOM_TEST_FILE_NAMES.has(name)) {
      return true;
    }

    if (name.startsWith('_')) {
      for (const tag of TEST_TAG) {
        if (name.includes(tag)) {
          return true;
        }
      }
    }

    const tag = name.split('.').at(-1);
    if (tag && TEST_TAG.has(tag)) {
      return true;
    }

    for (const seg of path.getSegs()) {
      if (TEST_DIR.has(seg)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Is this a tooling file?
   */
  private isToolingFile(path: RepoPath) {
    const segs = path.getSegs();
    if (
      segs.includes('scripts') &&
      !path.getRepoRel().startsWith('src/platform/plugins/shared/data/server/scripts/')
    ) {
      return true;
    }

    if (path.getFilename() === 'webpack.config' && path.getPkgInfo()?.pkgId !== '@kbn/optimizer') {
      return true;
    }

    return false;
  }

  /**
   * Apply canvas specific rules
   * @param root the root dir within the canvas plugin
   * @param dirs the directories after the root dir
   * @returns a type, or undefined if the file should be classified as a standard file
   */
  private classifyCanvas(root: string, dirs: string[]): ModuleType | undefined {
    if (root === 'canvas_plugin_src') {
      if (dirs[0] === 'expression_types') {
        return 'common package';
      }

      const subRoot = dirs.slice(0, 2).join('/');
      if (subRoot === 'functions/external') {
        return 'common package';
      }
      if (subRoot === 'functions/server') {
        return 'server package';
      }

      return 'browser package';
    }

    if (root === 'i18n') {
      return 'common package';
    }

    if (root === 'shareable_runtime') {
      return 'non-package';
    }

    if (root === 'tasks') {
      return 'tests or mocks';
    }
  }

  /**
   * Apply screenshotting specific rules
   * @param root the root dir within the screenshotting plugin
   * @returns a type, or undefined if the file should be classified as a standard file
   */
  private classifyScreenshotting(root: string): ModuleType | undefined {
    if (root === 'chromium') {
      return 'non-package';
    }
  }

  /**
   * Determine the "type" of a file
   */
  private getType(path: RepoPath): ModuleType {
    if (STATIC_EXTS.has(path.getExtname())) {
      return 'static';
    }

    if (this.isTestFile(path)) {
      return 'tests or mocks';
    }

    if (this.isToolingFile(path)) {
      return 'tooling';
    }

    const pkgInfo = path.getPkgInfo();
    if (!pkgInfo) {
      // TODO: consider if static, test or mock and tooling should only be checked before triggering non-package
      // GH ISSUE: https://github.com/elastic/kibana/issues/164110
      return 'non-package';
    }

    const { pkgId, rel } = pkgInfo;

    if (pkgId === '@kbn/test' || pkgId === '@kbn/test-subj-selector') {
      return 'common package';
    }

    const pkgIdWords = new Set(pkgId.split(/\W+/));
    // treat any package with "mocks" or "storybook" in the ID as a test-specific package
    if (pkgIdWords.has('mocks') || pkgIdWords.has('storybook') || pkgIdWords.has('test')) {
      return 'tests or mocks';
    }
    if (Array.from(pkgIdWords).at(-1) === 'cli') {
      return 'tooling';
    }

    const manifest = this.resolver.getPkgManifest(pkgId);
    if (manifest) {
      switch (manifest.type) {
        case 'functional-tests':
        case 'test-helper':
          return 'tests or mocks';
        case 'shared-browser':
          return 'browser package';
        case 'shared-server':
          return 'server package';
        case 'shared-scss':
          return 'static';
        case 'shared-common':
          return 'common package';
        case 'core':
        case 'plugin':
          // classification in plugins is more complicated, fall through to remaining logic
          break;
        default:
          // @ts-expect-error if there isn't an error here we are missing a case for a package type
          throw new Error(`unexpected package type [${manifest.type}]`);
      }
    }

    const [root, ...dirs] = rel.split('/');

    if (root === 'types') {
      return 'common package';
    }

    if (pkgId === '@kbn/canvas-plugin') {
      const type = this.classifyCanvas(root, dirs);
      if (type) {
        return type;
      }
    }

    if (pkgId === '@kbn/screenshotting-plugin') {
      const type = this.classifyScreenshotting(root);
      if (type) {
        return type;
      }
    }

    if (root === 'public' || root === 'static') {
      return 'browser package';
    }

    if (root === 'server') {
      return 'server package';
    }

    return 'common package';
  }

  private getManifest(path: RepoPath): KibanaPackageManifest | undefined {
    const pkgInfo = path.getPkgInfo();
    return pkgInfo?.pkgId ? this.resolver.getPkgManifest(pkgInfo!.pkgId) : undefined;
  }
  /**
   * Determine the "group" of a file
   */
  private getGroup(path: RepoPath): ModuleGroup {
    const attrs = inferGroupAttrsFromPath(path.getRepoRel());
    const manifest = this.getManifest(path);

    if (attrs.group !== 'common') {
      // this package has been moved to a 'group-specific' folder, the group is determined by its location
      return attrs.group;
    } else {
      // the package is still in its original location, allow Manifest to dictate its group
      return manifest?.group ?? 'common';
    }
  }

  /**
   * Determine the "visibility" of a file
   */
  private getVisibility(path: RepoPath): ModuleVisibility {
    const attrs = inferGroupAttrsFromPath(path.getRepoRel());
    const manifest = this.getManifest(path);

    if (attrs.group !== 'common') {
      // this package has been moved to a 'group-specific' folder, the visibility is determined by its location
      return attrs.visibility;
    } else {
      // the package is still in its original location, allow Manifest to dictate its visibility
      return manifest?.visibility ?? 'shared';
    }
  }

  classify(absolute: string): ModuleId {
    const path = this.getRepoPath(absolute);
    const cached = this.ids.get(path);

    if (cached) {
      return cached;
    }

    const id: ModuleId = {
      type: this.getType(path),
      group: this.getGroup(path),
      visibility: this.getVisibility(path),
      repoRel: path.getRepoRel(),
      pkgInfo: path.getPkgInfo() ?? undefined,
      manifest:
        (path.getPkgInfo() && this.resolver.getPkgManifest(path.getPkgInfo()!.pkgId)) ?? undefined,
      dirs: path.getSegs(),
    };
    this.ids.set(path, id);
    return id;
  }
}
