/**
 * Maps each app-id (passed by the embedded <glean-helper>) to the Glean
 * filter that constrains retrieval to only that app's knowledge.
 *
 * Adding a new app = add a new entry here. The shape of `filters` matches
 * Glean's Chat API `inclusions` block; tweak per your tenant's taxonomy
 * (datasources, collections, labels, etc.).
 */

export interface GleanFacetFilter {
  fieldName: string
  values: { value: string; relationType?: 'EQUALS' }[]
}

export interface GleanScopeFilters {
  // Restrict to specific Glean datasources, e.g. ['confluence', 'github'].
  datasources?: string[]
  // Arbitrary facet filters, e.g. label=gleaninside.
  facetFilters?: GleanFacetFilter[]
}

export interface AppScope {
  label: string
  filters: GleanScopeFilters
  agentId?: string
}

export const appScopes: Record<string, AppScope> = {
  gleaninside: {
    label: 'Gleaninside demo app',
    agentId: '532b0e6b1e2b47feae7a373fca9fc1da',
    filters: {
      facetFilters: [
        { fieldName: 'label', values: [{ value: 'gleaninside' }] },
      ],
    },
  },
  'core-swap': {
    label: 'SWAP — Shear Wall Automation Platform',
    filters: {
      facetFilters: [
        { fieldName: 'label', values: [{ value: 'core-swap' }] },
      ],
    },
  },
}

export function getScope (appId: string): AppScope | undefined {
  return appScopes[appId]
}
