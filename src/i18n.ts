import en from '../locales/en.json';
import cn from '../locales/zh-CN.json';
import tw from '../locales/zh-TW.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import es from '../locales/es.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
export type Locale = 'en'|'zh-CN'|'zh-TW'|'ja'|'ko'|'es'|'de'|'fr';
export const dictionaries = {en,'zh-CN':cn,'zh-TW':tw,ja,ko,es,de,fr};
export function normalizeLocale(value: unknown): Locale {
  if(typeof value !== 'string') return 'en';
  const parts=value.replaceAll('_','-').toLowerCase().split('-');
  if(parts[0]==='zh') return parts.some(x=>['tw','hk','mo','hant'].includes(x))?'zh-TW':'zh-CN';
  return ['en','ja','ko','es','de','fr'].includes(parts[0])?parts[0] as Locale:'en';
}
export function strings(locale: unknown) {return dictionaries[normalizeLocale(locale)];}
export function number(value:number,locale:Locale){return new Intl.NumberFormat(locale,{useGrouping:!locale.startsWith('zh')}).format(value);}
export function countryName(code:string,locale:Locale){if(code==='XX')return strings(locale).unknown;return new Intl.DisplayNames([locale],{type:'region'}).of(code)||strings(locale).unknown;}
