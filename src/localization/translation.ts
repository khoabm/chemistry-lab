import { en, type MessageKey } from './en'
import { vi } from './vi'

export type Locale = 'en' | 'vi'
export type Translate = (key: MessageKey, values?: Readonly<Record<string, string | number>>) => string

export function resolveText(english: string, translated?: string | null): string {
  return translated?.trim() ? translated : english
}

export function translator(locale: Locale): Translate {
  const overrides: Partial<Record<MessageKey, string>> = locale === 'vi' ? vi : {}
  return (key, values = {}) => resolveText(en[key], overrides[key])
    .replace(/\{(\w+)\}/g, (token, name: string) => values[name] === undefined ? token : String(values[name]))
}
