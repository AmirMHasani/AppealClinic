/** Adapter: unprefixed names over json-store.ts */
export {
  jsonGetStore as getStore,
  jsonSaveStore as saveStore,
  jsonGetSettings as getSettings,
  jsonUpdateSettings as updateSettings,
  jsonListCases as listCases,
  jsonGetCase as getCase,
  jsonCreateCase as createCase,
  jsonUpdateCase as updateCase,
  jsonDeleteCase as deleteCase,
  jsonSeedDemoCases as seedDemoCases,
  jsonStatusCounts as statusCounts,
  jsonFindUserByEmail as findUserByEmail,
  jsonMigrateUserPasswordHash as migrateUserPasswordHash,
} from "./json-store";
