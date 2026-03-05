import { ItemView, WorkspaceLeaf, TFile, TFolder, normalizePath, moment } from 'obsidian';
import DailyNotesButBetterPlugin from './main';

export const VIEW_TYPE_CALENDAR = "daily-notes-but-better-view";

export class CalendarView extends ItemView {
    plugin: DailyNotesButBetterPlugin;
    currentDate: moment.Moment;
    existingDates: Set<string> = new Set();

    constructor(leaf: WorkspaceLeaf, plugin: DailyNotesButBetterPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.currentDate = window.moment();
    }

    getViewType() {
        return VIEW_TYPE_CALENDAR;
    }

    getDisplayText() {
        return "Daily notes but better calendar";
    }

    getIcon() {
        return "calendar-days";
    }

    async onOpen() {
        await this.refreshExistingDates();
        this.renderCalendar();

        // Listen for file changes so dots update automatically
        this.registerEvent(this.app.metadataCache.on('changed', (file) => {
            if (this.plugin.settings.logMode === 'single' && file.path === normalizePath(this.plugin.settings.targetFilePath)) {
                void (async () => {
                    await this.refreshExistingDates();
                    this.renderCalendar();
                })();
            } else if (this.plugin.settings.logMode === 'multi' && file.path.startsWith(normalizePath(this.plugin.settings.multiModeFolder))) {
                void (async () => {
                    await this.refreshExistingDates();
                    this.renderCalendar();
                })();
            }
        }));
    }

    async refreshExistingDates() {
        this.existingDates.clear();

        if (this.plugin.settings.logMode === 'single') {
            const filePath = normalizePath(this.plugin.settings.targetFilePath);
            const abstractFile = this.app.vault.getAbstractFileByPath(filePath);
            if (abstractFile instanceof TFile) {
                const content = await this.app.vault.read(abstractFile);
                // Extract all headers matching YYYY-MM-DD
                const regex = /^## (\d{4}-\d{2}-\d{2})/gm;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    this.existingDates.add(match[1]);
                }
            }
        } else {
            const folderPath = normalizePath(this.plugin.settings.multiModeFolder);
            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (folder instanceof TFolder) {
                // Extract dates from file names
                for (const file of folder.children) {
                    if (file instanceof TFile && file.extension === 'md') {
                        // Attempt to parse the filename using the configured format
                        const dateObj = window.moment(file.basename, this.plugin.settings.multiModeFormat, true);
                        if (dateObj.isValid()) {
                            this.existingDates.add(dateObj.format('YYYY-MM-DD'));
                        }
                    }
                }
            }
        }
    }

    renderCalendar() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('udc-view-container');

        const headerEl = container.createDiv({ cls: 'udc-header' });

        const prevBtn = headerEl.createEl('button', { text: '<', cls: 'udc-nav-btn' });
        prevBtn.addEventListener('click', () => {
            this.currentDate.subtract(1, 'months');
            this.renderCalendar();
        });

        const titleEl = headerEl.createDiv({ cls: 'udc-title' });
        titleEl.setText(this.currentDate.format('MMMM YYYY'));

        const nextBtn = headerEl.createEl('button', { text: '>', cls: 'udc-nav-btn' });
        nextBtn.addEventListener('click', () => {
            this.currentDate.add(1, 'months');
            this.renderCalendar();
        });

        const goTodayBtn = headerEl.createEl('button', { text: 'Today', cls: 'udc-nav-btn' });
        goTodayBtn.addEventListener('click', () => {
            this.currentDate = window.moment();
            this.renderCalendar();
        });

        const gridEl = container.createDiv({ cls: 'udc-grid' });

        const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        days.forEach(day => {
            gridEl.createDiv({ cls: 'udc-day-header', text: day });
        });

        const startOfMonth = this.currentDate.clone().startOf('month');
        const endOfMonth = this.currentDate.clone().endOf('month');
        const startDayOfWeek = startOfMonth.day();

        for (let i = 0; i < startDayOfWeek; i++) {
            gridEl.createDiv({ cls: 'udc-cell empty' });
        }

        const today = window.moment();
        const totalDays = endOfMonth.date();

        for (let i = 1; i <= totalDays; i++) {
            const dateObj = this.currentDate.clone().date(i);
            const dateStr = dateObj.format('YYYY-MM-DD');

            const cell = gridEl.createDiv({ cls: 'udc-cell date-cell' });

            const numberSpan = cell.createSpan({ cls: 'udc-date-number' });
            numberSpan.setText(`${i}`);

            if (dateObj.isSame(today, 'day')) {
                cell.addClass('is-today');
            }

            // Add dot marker if this day has a log
            if (this.existingDates.has(dateStr)) {
                cell.addClass('has-log');
                cell.createSpan({ cls: 'udc-dot' });
            }

            cell.addEventListener('click', () => {
                void this.plugin.handleDateClick(dateObj);
            });
        }
    }
}
