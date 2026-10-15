# Translation handoff

Eight locales are wired: en, zh-CN, zh-TW, ja, ko, es, de, fr. zh-HK uses zh-TW; bare zh uses zh-CN; unknown host locales use English. English and Chinese require the operator's review. The other five JSON files contain English fallback strings and a visible pending-translation notice. They are not final translations.

translation-handoff.csv includes every interface key for a professional translator. Preserve IPv6, NAT, DNS, APNIC Labs, 17NAS and placeholders such as {rank}, {region}, {count}. Daily query counts are omitted from the first release. Translation-drafts contain only the two AI-generated examples requested by the operator, with confidence; do not copy them into production without review. Test narrow mobile layouts, number/date formatting, errors, loading and country names after translation. Legal pages are English drafts.
