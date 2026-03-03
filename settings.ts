import { App, PluginSettingTab, Setting } from 'obsidian';
import DailyNotesButBetterPlugin from './main';

export class DailyNotesButBetterSettingTab extends PluginSettingTab {
    plugin: DailyNotesButBetterPlugin;

    constructor(app: App, plugin: DailyNotesButBetterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Daily Notes But Better Settings' });

        new Setting(containerEl)
            .setName('Log Mode')
            .setDesc('How should calendar clicks interact with your vault?')
            .addDropdown(dropdown => dropdown
                .addOption('single', 'Single Master File')
                .addOption('multi', 'One File Per Day')
                .setValue(this.plugin.settings.logMode)
                .onChange(async (value: 'single' | 'multi') => {
                    this.plugin.settings.logMode = value;
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

        if (this.plugin.settings.logMode === 'single') {
            containerEl.createEl('h3', { text: 'Single Master File Settings' });

            new Setting(containerEl)
                .setName('Target Master File Path')
                .setDesc('Path to the single master file (e.g. 02 Personal/Log/Daily Log.md)')
                .addText(text => text
                    .setPlaceholder('02 Personal/Log/Daily Log.md')
                    .setValue(this.plugin.settings.targetFilePath)
                    .onChange(async (value) => {
                        this.plugin.settings.targetFilePath = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Header Date Format')
                .setDesc('Moment format for injected header strings')
                .addText(text => text
                    .setPlaceholder('YYYY-MM-DD - dddd, MMMM D, YYYY')
                    .setValue(this.plugin.settings.dateFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.dateFormat = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Template File Path')
                .setDesc('Optional template to duplicate under the new header when inserted')
                .addText(text => text
                    .setPlaceholder('02 Personal/Templates/Daily.md')
                    .setValue(this.plugin.settings.multiModeTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.multiModeTemplate = value;
                        await this.plugin.saveSettings();
                    }));
        } else {
            containerEl.createEl('h3', { text: 'One File Per Day Settings' });

            new Setting(containerEl)
                .setName('Daily Logs Folder')
                .setDesc('Folder where daily files are created')
                .addText(text => text
                    .setPlaceholder('02 Personal/Log')
                    .setValue(this.plugin.settings.multiModeFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.multiModeFolder = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Daily Note File Format')
                .setDesc('Moment format for the file name (e.g. YYYY-MM-DD)')
                .addText(text => text
                    .setPlaceholder('YYYY-MM-DD')
                    .setValue(this.plugin.settings.multiModeFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.multiModeFormat = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Template File Path')
                .setDesc('Path to the template for new daily notes')
                .addText(text => text
                    .setPlaceholder('02 Personal/Templates/Daily.md')
                    .setValue(this.plugin.settings.multiModeTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.multiModeTemplate = value;
                        await this.plugin.saveSettings();
                    }));
        }
    }
}
