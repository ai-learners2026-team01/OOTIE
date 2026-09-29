globalThis.OOTIE_EXTENSION_CONFIG = Object.freeze({
  settingsStorageKey: 'ootieExtensionSettings',
  legacyStorageKey: 'ootie_custom_endpoint',
  defaultEnvironment: 'development',
  environments: Object.freeze({
    development: Object.freeze({
      label: '開發環境',
      url: 'http://localhost:5173/bookmarks'
    }),
    production: Object.freeze({
      label: '正式環境',
      url: ''
    })
  })
});