export interface DailyNotesButBetterSettings {
    logMode: 'single' | 'multi';
    targetFilePath: string;
    dateFormat: string;
    multiModeFolder: string;
    multiModeFormat: string;
    multiModeTemplate: string;
}

export const DEFAULT_SETTINGS: DailyNotesButBetterSettings = {
    logMode: 'single',
    targetFilePath: '02 Personal/Log/Daily Log.md',
    dateFormat: 'YYYY-MM-DD - dddd, MMMM D, YYYY',
    multiModeFolder: '02 Personal/Log',
    multiModeFormat: 'YYYY-MM-DD',
    multiModeTemplate: ''
}
