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

        new Setting(containerEl)
            .setName('Log mode')
            .setDesc('How should calendar clicks interact with your vault?')
            .addDropdown(dropdown => dropdown
                .addOption('single', 'Single master file')
                .addOption('multi', 'One file per day')
                .setValue(this.plugin.settings.logMode)
                .onChange(async (value: string) => {
                    this.plugin.settings.logMode = value as 'single' | 'multi';
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

        if (this.plugin.settings.logMode === 'single') {
            new Setting(containerEl).setName('Single master file').setHeading();

            new Setting(containerEl)
                .setName('Target master file path')
                .setDesc('Path to the single master file (e.g. 02 Personal/Log/Daily Log.md)')
                .addText(text => {
                    text.setPlaceholder('Example path/to/daily-log.md');
                    text.setValue(this.plugin.settings.targetFilePath)
                        .onChange(async (value) => {
                            this.plugin.settings.targetFilePath = value;
                            await this.plugin.saveSettings();
                        });
                    return text;
                });

            new Setting(containerEl)
                .setName('Header date format')
                .setDesc('Moment format for injected header strings')
                .addText(text => {
                    const formatPlaceholder = 'YYYY-MM-DD - dddd, MMMM D, YYYY';
                    text.setPlaceholder(formatPlaceholder);
                    text.setValue(this.plugin.settings.dateFormat)
                        .onChange(async (value) => {
                            this.plugin.settings.dateFormat = value;
                            await this.plugin.saveSettings();
                        });
                    return text;
                });

            new Setting(containerEl)
                .setName('Template file path')
                .setDesc('Optional template to duplicate under the new header when inserted')
                .addText(text => {
                    text.setPlaceholder('Example path/to/template.md');
                    text.setValue(this.plugin.settings.multiModeTemplate)
                        .onChange(async (value) => {
                            this.plugin.settings.multiModeTemplate = value;
                            await this.plugin.saveSettings();
                        });
                    return text;
                });
        } else {
            new Setting(containerEl).setName('One file per day').setHeading();

            new Setting(containerEl)
                .setName('Daily logs folder')
                .setDesc('Folder where daily files are created')
                .addText(text => {
                    text.setPlaceholder('Example path/to/folder');
                    text.setValue(this.plugin.settings.multiModeFolder)
                        .onChange(async (value) => {
                            this.plugin.settings.multiModeFolder = value;
                            await this.plugin.saveSettings();
                        });
                    return text;
                });

            const multiModeDesc = 'Moment format for the file name (e.g. YYYY-MM-DD)';
            new Setting(containerEl)
                .setName('Daily note file format')
                .setDesc(multiModeDesc)
                .addText(text => {
                    const multiModePlaceholder = 'YYYY-MM-DD';
                    text.setPlaceholder(multiModePlaceholder);
                    text.setValue(this.plugin.settings.multiModeFormat)
                        .onChange(async (value) => {
                            this.plugin.settings.multiModeFormat = value;
                            await this.plugin.saveSettings();
                        });
                    return text;
                });

            new Setting(containerEl)
                .setName('Template file path')
                .setDesc('Path to the template for new daily notes')
                .addText(text => {
                    text.setPlaceholder('Example path/to/template.md');
                    text.setValue(this.plugin.settings.multiModeTemplate)
                        .onChange(async (value) => {
                            this.plugin.settings.multiModeTemplate = value;
                            await this.plugin.saveSettings();
                        });
                    return text;
                });
        }
    }
}
