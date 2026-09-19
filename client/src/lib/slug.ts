import { normalizeText } from './mapLocations';

/** "Nhà hát thành phố" -> "nha-hat-thanh-pho" */
export const slugify = (value: string) => normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
