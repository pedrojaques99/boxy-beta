import { i18n } from './src/i18n/settings'

// This is the configuration file next-intl is looking for
export default {
  locales: i18n.locales,
  defaultLocale: i18n.defaultLocale,
  // Optional: Disable localeDetection
  localeDetection: false,
  // Optional: Configuring how messages are loaded
  messages: async (locale) => {
    // Import the messages for the requested locale
    return (await import(`./src/i18n/locales/${locale}.json`)).default;
  }
} 