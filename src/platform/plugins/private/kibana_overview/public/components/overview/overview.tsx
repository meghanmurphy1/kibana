/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { snakeCase } from 'lodash';
import React, { FC, useState, useEffect, useMemo } from 'react';
import { css } from '@emotion/react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiScreenReaderOnly,
  EuiSpacer,
  EuiTitle,
  EuiLoadingSpinner,
  useEuiMinBreakpoint,
  UseEuiTheme,
  useEuiTheme,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import { CoreStart } from '@kbn/core/public';
import {
  useKibana,
  overviewPageActions,
  OverviewPageFooter,
} from '@kbn/kibana-react-plugin/public';
import { KibanaPageTemplate } from '@kbn/shared-ux-page-kibana-template';
import { KibanaSolutionAvatar } from '@kbn/shared-ux-avatar-solution';
import {
  RedirectAppLinksContainer as RedirectAppLinks,
  RedirectAppLinksKibanaProvider,
} from '@kbn/shared-ux-link-redirect-app';
import { useKibanaIsDarkMode } from '@kbn/react-kibana-context-theme';
import { FetchResult } from '@kbn/newsfeed-plugin/public';
import {
  FeatureCatalogueEntry,
  FeatureCatalogueSolution,
  FeatureCatalogueCategory,
} from '@kbn/home-plugin/public';
import { withSuspense } from '@kbn/shared-ux-utility';
import classNames from 'classnames';
import { PLUGIN_ID, PLUGIN_PATH } from '../../../common';
import { AppPluginStartDependencies } from '../../types';
import { AddData } from '../add_data';
import { ManageData } from '../manage_data';
import { NewsFeed } from '../news_feed';
import { METRIC_TYPE, trackUiMetric } from '../../lib/ui_metric';

const sortByOrder = (featureA: FeatureCatalogueEntry, featureB: FeatureCatalogueEntry) =>
  (featureA.order || Infinity) - (featureB.order || Infinity);

interface Props {
  newsFetchResult: FetchResult | null | void;
  solutions: FeatureCatalogueSolution[];
  features: FeatureCatalogueEntry[];
}

export const Overview: FC<Props> = ({ newsFetchResult, solutions, features }) => {
  const [isNewKibanaInstance, setNewKibanaInstance] = useState(false);
  const [hasESData, setHasESData] = useState(false);
  const [hasDataView, setHasDataView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { services } = useKibana<CoreStart & AppPluginStartDependencies>();
  const { http, docLinks, dataViews, share, application, chrome, dataViewEditor, customBranding } =
    services;
  const addBasePath = http.basePath.prepend;
  const { euiTheme } = useEuiTheme();
  const isDarkMode = useKibanaIsDarkMode();
  const minBreakpointM = useEuiMinBreakpoint('m');

  // Home does not have a locator implemented, so hard-code it here.
  const addDataHref = addBasePath('/app/integrations/browse');
  const devToolsHref = share.url.locators.get('CONSOLE_APP_LOCATOR')?.useUrl({});
  const managementHref = share.url.locators
    .get('MANAGEMENT_APP_LOCATOR')
    ?.useUrl({ sectionId: '' });

  const getFeaturesByCategory = (category: FeatureCatalogueCategory) =>
    features
      .filter((feature) => feature.showOnHomePage && feature.category === category)
      .sort(sortByOrder);

  const getSolutionGraphicURL = (solutionId: string) =>
    `/plugins/kibanaReact/assets/solutions_${solutionId}.svg`;

  const findFeatureById = (featureId: string) => features.find(({ id }) => id === featureId);
  const kibanaApps = features.filter(({ solutionId }) => solutionId === 'kibana').sort(sortByOrder);
  const addDataFeatures = getFeaturesByCategory('data');
  const manageDataFeatures = getFeaturesByCategory('admin');
  const devTools = findFeatureById('console');
  // Show card for console if none of the manage data plugins are available, most likely in OSS
  if (manageDataFeatures.length < 1 && devTools) {
    manageDataFeatures.push(devTools);
  }

  useEffect(() => {
    const fetchIsNewKibanaInstance = async () => {
      const checkData = async () => {
        const hasUserDataViewValue = await dataViews.hasData.hasUserDataView();
        const hasESDataValue = await dataViews.hasData.hasESData();
        setNewKibanaInstance((!hasUserDataViewValue && hasESDataValue) || !hasESDataValue);
        setHasDataView(hasUserDataViewValue);
        setHasESData(hasESDataValue);
      };

      await checkData().catch((e) => {
        setNewKibanaInstance(false);
        setHasDataView(true);
        setHasESData(true);
        setIsLoading(false);
      });

      setIsLoading(false);
    };

    fetchIsNewKibanaInstance();
  }, [dataViews]);

  const renderAppCard = (appId: string) => {
    const app = kibanaApps.find(({ id }) => id === appId);

    return app ? (
      <EuiFlexItem className="kbnOverviewApps__item" key={appId}>
        <RedirectAppLinksKibanaProvider
          coreStart={{
            application: {
              currentAppId$: application.currentAppId$,
              navigateToUrl: application.navigateToUrl,
            },
          }}
          {...application}
        >
          <RedirectAppLinks>
            <EuiCard
              description={app?.subtitle || ''}
              href={addBasePath(app.path)}
              onClick={() => {
                trackUiMetric(METRIC_TYPE.CLICK, `app_card_${appId}`);
              }}
              image={addBasePath(
                `/plugins/${PLUGIN_ID}/assets/kibana_${appId}_${isDarkMode ? 'dark' : 'light'}.svg`
              )}
              title={app.title}
              titleElement="h3"
              titleSize="s"
            />
          </RedirectAppLinks>
        </RedirectAppLinksKibanaProvider>
      </EuiFlexItem>
    ) : null;
  };

  // Dashboard and discover are displayed in larger cards
  const mainApps = ['dashboards', 'discover'];
  const remainingApps = kibanaApps.map(({ id }) => id).filter((id) => !mainApps.includes(id));
  const mainAppsUserHasAccessTo = useMemo(() => {
    const applications = [];
    if (application.capabilities.dashboard_v2?.show) {
      applications.push('dashboards');
    }

    if (application.capabilities.discover_v2?.show) {
      applications.push('discover');
    }

    return applications;
  }, [application.capabilities]);

  const onDataViewCreated = () => {
    setNewKibanaInstance(false);
  };

  if (isLoading) {
    return (
      <EuiFlexGroup justifyContent="center" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="xl" />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (isNewKibanaInstance) {
    const analyticsServices = {
      coreStart: {
        application,
        chrome,
        docLinks,
        http,
        customBranding,
      },
      dataViews: {
        ...dataViews,
        hasData: {
          ...dataViews.hasData,

          // We've already called this, so we can optimize the analytics services to
          // use the already-retrieved data to avoid a double-call.
          hasESData: () => Promise.resolve(hasESData),
          hasUserDataView: () => Promise.resolve(hasDataView),
        },
      },
      dataViewEditor,
      share,
    };

    const importPromise = import('@kbn/shared-ux-page-analytics-no-data');
    const AnalyticsNoDataPageKibanaProvider = withSuspense(
      React.lazy(() =>
        importPromise.then(({ AnalyticsNoDataPageKibanaProvider: NoDataProvider }) => {
          return { default: NoDataProvider };
        })
      )
    );
    const AnalyticsNoDataPage = withSuspense(
      React.lazy(() =>
        importPromise.then(({ AnalyticsNoDataPage: NoDataPage }) => {
          return { default: NoDataPage };
        })
      )
    );

    return (
      <AnalyticsNoDataPageKibanaProvider {...analyticsServices}>
        <AnalyticsNoDataPage onDataViewCreated={onDataViewCreated} />
      </AnalyticsNoDataPageKibanaProvider>
    );
  }

  return (
    <KibanaPageTemplate
      css={styles(euiTheme, minBreakpointM)}
      pageHeader={{
        iconType: 'logoKibana',
        pageTitle: <FormattedMessage defaultMessage="Analytics" id="kibanaOverview.header.title" />,
        rightSideItems: overviewPageActions({
          addDataHref,
          application,
          devToolsHref,
          hidden: isNewKibanaInstance,
          managementHref,
          showDevToolsLink: !!devTools,
          showManagementLink: !!manageDataFeatures,
        }),
        bottomBorder: true,
      }}
      panelled={false}
    >
      <KibanaPageTemplate.Section bottomBorder aria-labelledby="kbnOverviewApps__title">
        <EuiScreenReaderOnly>
          <h2 id="kbnOverviewApps__title">
            <FormattedMessage id="kibanaOverview.apps.title" defaultMessage="Explore these apps" />
          </h2>
        </EuiScreenReaderOnly>

        {mainAppsUserHasAccessTo.length ? (
          <>
            <EuiFlexGroup className="kbnOverviewMainApps" justifyContent="center">
              {mainAppsUserHasAccessTo.map(renderAppCard)}
            </EuiFlexGroup>

            <EuiSpacer size="l" />
          </>
        ) : null}

        {remainingApps.length ? (
          <EuiFlexGroup className="kbnOverviewRemainingApps" justifyContent="center">
            {remainingApps.map(renderAppCard)}
          </EuiFlexGroup>
        ) : null}
      </KibanaPageTemplate.Section>

      <KibanaPageTemplate.Section bottomBorder paddingSize="xl">
        <EuiFlexGroup
          alignItems="flexStart"
          className={classNames({
            'kbnOverviewSupplements--noNews': !newsFetchResult?.feedItems?.length,
          })}
        >
          {newsFetchResult && newsFetchResult.feedItems.length ? (
            <EuiFlexItem grow={1}>
              <NewsFeed newsFetchResult={newsFetchResult} />
            </EuiFlexItem>
          ) : null}

          <EuiFlexItem grow={3}>
            {solutions.length ? (
              <section aria-labelledby="kbnOverviewMore__title">
                <EuiTitle size="s">
                  <h2 id="kbnOverviewMore__title">
                    <FormattedMessage
                      id="kibanaOverview.more.title"
                      defaultMessage="Do more with Elastic"
                    />
                  </h2>
                </EuiTitle>

                <EuiSpacer size="m" />

                <EuiFlexGroup>
                  {solutions.map(({ id, title, description, icon, path }) => (
                    <EuiFlexItem
                      data-test-subj="kbnOverviewItem"
                      key={id}
                      className="kbnOverviewItemSolution"
                    >
                      <RedirectAppLinksKibanaProvider
                        coreStart={{
                          application: {
                            currentAppId$: application.currentAppId$,
                            navigateToUrl: application.navigateToUrl,
                          },
                        }}
                        {...application}
                      >
                        <RedirectAppLinks className="kbnRedirectAppLinkImage">
                          <EuiCard
                            className={`kbnOverviewSolution--${id}`}
                            description={description ? description : ''}
                            href={addBasePath(path)}
                            icon={<KibanaSolutionAvatar name={title} iconType={icon} size="xl" />}
                            image={addBasePath(getSolutionGraphicURL(snakeCase(id)))}
                            title={title}
                            titleElement="h3"
                            titleSize="xs"
                            onClick={() => {
                              trackUiMetric(METRIC_TYPE.CLICK, `solution_panel_${id}`);
                            }}
                          />
                        </RedirectAppLinks>
                      </RedirectAppLinksKibanaProvider>
                    </EuiFlexItem>
                  ))}
                </EuiFlexGroup>
              </section>
            ) : (
              <EuiFlexGroup
                css={css({
                  ...(addDataFeatures.length > 1 && manageDataFeatures.length > 1
                    ? { flexDirection: 'column' }
                    : {}),
                })}
              >
                <EuiFlexItem>
                  <AddData addBasePath={addBasePath} features={addDataFeatures} />
                </EuiFlexItem>

                <EuiFlexItem>
                  <ManageData addBasePath={addBasePath} features={manageDataFeatures} />
                </EuiFlexItem>
              </EuiFlexGroup>
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      </KibanaPageTemplate.Section>

      <OverviewPageFooter
        addBasePath={addBasePath}
        path={PLUGIN_PATH}
        onSetDefaultRoute={() => {
          trackUiMetric(METRIC_TYPE.CLICK, 'set_kibana_overview_as_default_route');
        }}
        onChangeDefaultRoute={() => {
          trackUiMetric(METRIC_TYPE.CLICK, 'change_to_different_default_route');
        }}
      />
    </KibanaPageTemplate>
  );
};

const styles = (euiTheme: UseEuiTheme['euiTheme'], minBreakpointM: string) =>
  css({
    '.kbnRedirectAppLinkImage': {
      '.enterpriseSearch': {
        '.euiCard__image': {
          backgroundColor: euiTheme.colors.warning,
        },
      },
      '.observability': {
        '.euiCard__image': {
          backgroundColor: euiTheme.colors.accent,
        },
      },
      '.securitySolution': {
        '.euiCard__image': {
          backgroundColor: euiTheme.colors.accentSecondary,
        },
      },
    },
    '.kbnOverviewItemSolution': {
      [minBreakpointM]: {
        maxWidth: `calc(33.333% - ${euiTheme.size.l})`,
      },
    },
    '.kbnOverviewRemainingApps': {
      '.kbnOverviewApps__item': {
        [minBreakpointM]: {
          maxWidth: `calc(25% - ${euiTheme.size.l})`,
        },
      },
    },
    '.kbnOverviewMainApps': {
      '.kbnOverviewApps__item': {
        [minBreakpointM]: {
          maxWidth: `calc(50% - ${euiTheme.size.l})`,
        },
      },
    },
    '.kbnOverviewSupplements--noNews h2': {
      [minBreakpointM]: {
        textAlign: 'center',
      },
    },
  });
