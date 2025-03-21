/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { HomePublicPluginSetup } from '@kbn/home-plugin/public';
import { DevToolsSetup } from '@kbn/dev-tools-plugin/public';
import { SharePluginSetup } from '@kbn/share-plugin/public';
import { LicensingPluginSetup } from '@kbn/licensing-plugin/public';
import {
  AnalyticsServiceStart,
  I18nStart,
  ThemeServiceStart,
  UserProfileService,
} from '@kbn/core/public';

export interface SearchProfilerStartServices {
  analytics: Pick<AnalyticsServiceStart, 'reportEvent'>;
  i18n: I18nStart;
  theme: Pick<ThemeServiceStart, 'theme$'>;
  userProfile: UserProfileService;
}

export interface AppPublicPluginDependencies {
  licensing: LicensingPluginSetup;
  home: HomePublicPluginSetup;
  devTools: DevToolsSetup;
  share: SharePluginSetup;
}
