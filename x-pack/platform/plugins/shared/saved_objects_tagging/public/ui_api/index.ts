/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SavedObjectsTaggingApiUi } from '@kbn/saved-objects-tagging-oss-plugin/public';
import { TagsCapabilities } from '../../common';
import { ITagsCache, ITagInternalClient } from '../services';
import { StartServices } from '../types';
import {
  getTagIdsFromReferences,
  replaceTagReferences,
  convertTagNameToId,
  getTag,
} from '../../common';
import { getComponents } from './components';
import { buildGetTableColumnDefinition } from './get_table_column_definition';
import { buildGetSearchBarFilter } from './get_search_bar_filter';
import { buildParseSearchQuery } from './parse_search_query';
import { buildConvertNameToReference } from './convert_name_to_reference';
import { buildGetTagList } from './get_tag_list';

interface GetUiApiOptions extends StartServices {
  capabilities: TagsCapabilities;
  cache: ITagsCache;
  client: ITagInternalClient;
}

export const getUiApi = ({
  cache,
  capabilities,
  client,
  ...startServices
}: GetUiApiOptions): SavedObjectsTaggingApiUi => {
  const components = getComponents({
    ...startServices,
    cache,
    capabilities,
    tagClient: client,
  });

  const getTagList = buildGetTagList(cache);

  return {
    components,
    getTableColumnDefinition: buildGetTableColumnDefinition({ components, cache }),
    getSearchBarFilter: buildGetSearchBarFilter({ getTagList }),
    parseSearchQuery: buildParseSearchQuery({ cache }),
    convertNameToReference: buildConvertNameToReference({ cache }),
    getTagIdsFromReferences,
    getTagIdFromName: (tagName: string) => convertTagNameToId(tagName, cache.getState()),
    updateTagsReferences: replaceTagReferences,
    getTag: (tagId: string) => getTag(tagId, cache.getState()),
    getTagList,
  };
};
