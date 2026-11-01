export const TEXT_SIZES = [60, 65, 75, 85, 100, 115, 130, 150, 175, 200] as const;
export const TEXT_SIZE_KEY = 'gospel-atlas:text-size';

export function parseTextSize(value: string | null): number {
 const size = Number(value);
 return TEXT_SIZES.some(n => n === size) ? size : 100;
}

export function stepTextSize(size: number, direction: -1 | 1): number {
 const current = TEXT_SIZES.indexOf(parseTextSize(String(size)) as typeof TEXT_SIZES[number]);
 return TEXT_SIZES[Math.max(0, Math.min(TEXT_SIZES.length - 1, current + direction))];
}

// Private browsing, blocked storage, and older saved values must never block reading.
export function loadTextSize(storage: Pick<Storage, 'getItem'>): number {
 try { return parseTextSize(storage.getItem(TEXT_SIZE_KEY)); } catch { return 100; }
}

export function saveTextSize(storage: Pick<Storage, 'setItem'>, size: number): void {
 try { storage.setItem(TEXT_SIZE_KEY, String(parseTextSize(String(size)))); } catch { /* session preference still works */ }
}
