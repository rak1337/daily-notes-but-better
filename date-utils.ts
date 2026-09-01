/**
 * Returns the canonical date for a configured daily-log heading.
 *
 * The calendar stores dates as YYYY-MM-DD internally, while users can choose
 * any Moment-compatible format for the heading that is written to their log.
 */
export function parseLogHeader(line: string, dateFormat: string): string | null {
    if (!line.startsWith('## ')) {
        return null;
    }

    const parsedDate = window.moment(line.slice(3), dateFormat, true);
    return parsedDate.isValid() ? parsedDate.format('YYYY-MM-DD') : null;
}
