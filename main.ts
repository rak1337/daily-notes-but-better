import { Plugin, TFile, Notice, MarkdownView, normalizePath, moment } from 'obsidian';
import { DailyNotesButBetterSettings, DEFAULT_SETTINGS } from './types';
import { DailyNotesButBetterSettingTab } from './settings';
import { CalendarView, VIEW_TYPE_CALENDAR } from './calendar';

export default class DailyNotesButBetterPlugin extends Plugin {
    settings!: DailyNotesButBetterSettings;

    async onload() {
        await this.loadSettings();

        this.registerView(VIEW_TYPE_CALENDAR, (leaf) => new CalendarView(leaf, this));

        this.addRibbonIcon('calendar-days', 'Open daily notes but better', () => {
            void this.activateView();
        });

        this.addCommand({
            id: 'open',
            name: 'Open calendar view',
            callback: () => { void this.activateView(); }
        });

        this.addSettingTab(new DailyNotesButBetterSettingTab(this.app, this));
    }

    async activateView() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
        const leaf = this.app.workspace.getRightLeaf(false);
        if (leaf) {
            await leaf.setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
            const calendarLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
            if (calendarLeaves.length > 0) {
                void this.app.workspace.revealLeaf(calendarLeaves[0]);
            }
        }
    }

    onunload() {
    }

    async loadSettings() {
        const loadedData = (await this.loadData()) as unknown;
        this.settings = { ...DEFAULT_SETTINGS, ...(loadedData as Partial<DailyNotesButBetterSettings>) };
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Refresh calendar view if settings change
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
        if (leaves.length > 0) {
            const view = leaves[0].view;
            if (view instanceof CalendarView) {
                await view.refreshExistingDates();
                view.renderCalendar();
            }
        }
    }

    async handleDateClick(dateObj: moment.Moment) {
        if (this.settings.logMode === 'single') {
            await this.handleSingleFileMode(dateObj);
        } else {
            await this.handleMultiFileMode(dateObj);
        }
    }

    async handleMultiFileMode(dateObj: moment.Moment) {
        const folderPath = this.settings.multiModeFolder;
        const fileName = dateObj.format(this.settings.multiModeFormat) + ".md";
        const fullPath = normalizePath(`${folderPath}/${fileName}`);

        let file = this.app.vault.getAbstractFileByPath(fullPath);

        if (file instanceof TFile) {
            const leaf = this.app.workspace.getLeaf(false);
            await leaf.openFile(file);
        } else {
            let content = "";
            const templatePath = this.settings.multiModeTemplate;
            if (templatePath) {
                const tplFile = this.app.vault.getAbstractFileByPath(normalizePath(templatePath));
                if (tplFile instanceof TFile) {
                    content = await this.app.vault.read(tplFile);
                } else {
                    new Notice("Template file not found. Creating empty daily note.");
                }
            }

            try {
                const folder = this.app.vault.getAbstractFileByPath(normalizePath(folderPath));
                if (!folder) {
                    await this.app.vault.createFolder(normalizePath(folderPath));
                }

                const newFile = await this.app.vault.create(fullPath, content);
                const leaf = this.app.workspace.getLeaf(false);
                await leaf.openFile(newFile);

                if (leaf.view instanceof MarkdownView) {
                    const editor = leaf.view.editor;
                    const lastLine = editor.lineCount() - 1;
                    editor.setCursor({ line: lastLine, ch: editor.getLine(lastLine).length });
                    editor.focus();
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                new Notice("Error creating daily note: " + errorMessage);
            }
        }
    }

    async handleSingleFileMode(dateObj: moment.Moment) {
        const filePath = normalizePath(this.settings.targetFilePath);
        const abstractFile = this.app.vault.getAbstractFileByPath(filePath);

        if (!abstractFile || !(abstractFile instanceof TFile)) {
            new Notice(`Target master file not found: ${filePath}`);
            return;
        }

        const targetFile = abstractFile;
        const fileContent = await this.app.vault.read(targetFile);

        // Explicit format we use for tracking dots
        const dateStr = dateObj.format('YYYY-MM-DD');

        // Header we actually inject
        const fullHeaderString = dateObj.format(this.settings.dateFormat);
        const expectedHeaderStr = `## ${fullHeaderString}`;

        const lines = fileContent.split('\n');
        let targetObjLine = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith(`## ${dateStr}`)) {
                targetObjLine = i;
                break;
            }
        }

        if (targetObjLine !== -1) {
            await this.navigateToFileAndLine(targetFile, targetObjLine);
        } else {
            let insertLine = -1;
            let fileHasHeaders = false;
            const dateVal = dateObj.valueOf();

            for (let i = 0; i < lines.length; i++) {
                const match = lines[i].match(/^## (\d{4}-\d{2}-\d{2})/);
                if (match) {
                    fileHasHeaders = true;
                    const headerDate = window.moment(match[1], "YYYY-MM-DD");
                    if (headerDate.valueOf() < dateVal) {
                        insertLine = i;
                        break;
                    }
                }
            }

            let newLines = [...lines];

            let templateContent = "";
            const templatePath = this.settings.multiModeTemplate;
            if (templatePath) {
                const tplFile = this.app.vault.getAbstractFileByPath(normalizePath(templatePath));
                if (tplFile instanceof TFile) {
                    templateContent = await this.app.vault.read(tplFile);
                }
            }

            const injectionBlock = templateContent ? ['', expectedHeaderStr, templateContent, '---', ''] : ['', expectedHeaderStr, '', '---', ''];

            if (insertLine !== -1) {
                newLines.splice(insertLine, 0, ...injectionBlock);
                targetObjLine = insertLine + 1;
            } else if (!fileHasHeaders) {
                newLines.splice(newLines.length, 0, ...injectionBlock);
                targetObjLine = newLines.length - 2;
            } else {
                newLines.splice(newLines.length, 0, ...injectionBlock);
                targetObjLine = newLines.length - 2;
            }

            const newContent = newLines.join('\n');
            await this.app.vault.modify(targetFile, newContent);
            await this.navigateToFileAndLine(targetFile, targetObjLine);
        }
    }

    async navigateToFileAndLine(file: TFile, lineNum: number) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);

        if (leaf.view instanceof MarkdownView) {
            const editor = leaf.view.editor;
            editor.setCursor({ line: lineNum, ch: 0 });
            editor.focus();
            leaf.view.currentMode.applyScroll(lineNum);
        }
    }
}
