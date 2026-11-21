// StorageEntry is one key/value pair saved in the platform's player storage.
export interface StorageEntry {
  key: string
  value: string
}

// ThemeConfig is the part of VK's config event that tells the theme.
export interface ThemeConfig {
  appearance?: string
  scheme?: string
}
