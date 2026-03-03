const obsidian = require('obsidian');

const DEFAULT_SETTINGS = {
  logMode: 'single',
  targetFilePath: '02 Personal/Log/Daily Log.md',
  dateFormat: 'YYYY-MM-DD - dddd, MMMM D, YYYY',
  multiModeFolder: '02 Personal/Log',
  multiModeFormat: 'YYYY-MM-DD',
  multiModeTemplate: ''
};

const VIEW_TYPE_CALENDAR = "unified-daily-calendar-view";

class CalendarView extends obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.existingDates = new Set();
    this.currentDate = window.moment();
  }

  getViewType() { return VIEW_TYPE_CALENDAR; }
  getDisplayText() { return "Unified Calendar"; }
  getIcon() { return "calendar-days"; }

  async onOpen() {
    await this.refreshExistingDates();
    this.renderCalendar();

    this.registerEvent(this.app.metadataCache.on('changed', async (file) => {
      if (this.plugin.settings.logMode === 'single' && file.path === obsidian.normalizePath(this.plugin.settings.targetFilePath)) {
        await this.refreshExistingDates();
        this.renderCalendar();
      } else if (this.plugin.settings.logMode === 'multi' && file.path.startsWith(obsidian.normalizePath(this.plugin.settings.multiModeFolder))) {
        await this.refreshExistingDates();
        this.renderCalendar();
      }
    }));
  }

  async refreshExistingDates() {
    this.existingDates.clear();
    if (this.plugin.settings.logMode === 'single') {
      const filePath = obsidian.normalizePath(this.plugin.settings.targetFilePath);
      const abstractFile = this.app.vault.getAbstractFileByPath(filePath);
      if (abstractFile instanceof obsidian.TFile) {
        const content = await this.app.vault.read(abstractFile);
        const regex = /^## (\d{4}-\d{2}-\d{2})/gm;
        let match;
        while ((match = regex.exec(content)) !== null) {
          this.existingDates.add(match[1]);
        }
      }
    } else {
      const folderPath = obsidian.normalizePath(this.plugin.settings.multiModeFolder);
      const folder = this.app.vault.getAbstractFileByPath(folderPath);
      if (folder && folder.children) {
        for (let i = 0; i < folder.children.length; i++) {
          const file = folder.children[i];
          if (file instanceof obsidian.TFile && file.extension === 'md') {
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
    prevBtn.addEventListener('click', () => { this.currentDate.subtract(1, 'months'); this.renderCalendar(); });

    const titleEl = headerEl.createDiv({ cls: 'udc-title' });
    titleEl.setText(this.currentDate.format('MMMM YYYY'));

    const nextBtn = headerEl.createEl('button', { text: '>', cls: 'udc-nav-btn' });
    nextBtn.addEventListener('click', () => { this.currentDate.add(1, 'months'); this.renderCalendar(); });

    const goTodayBtn = headerEl.createEl('button', { text: 'Today', cls: 'udc-nav-btn' });
    goTodayBtn.addEventListener('click', () => { this.currentDate = window.moment(); this.renderCalendar(); });

    const gridEl = container.createDiv({ cls: 'udc-grid' });

    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    days.forEach(day => { gridEl.createDiv({ cls: 'udc-day-header', text: day }); });

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

      if (this.existingDates.has(dateStr)) {
        cell.addClass('has-log');
        cell.createSpan({ cls: 'udc-dot' });
      }

      cell.addEventListener('click', () => {
        this.plugin.handleDateClick(dateObj);
      });
    }
  }
}

class UnifiedCalendarSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Unified Daily Calendar Settings' });

    new obsidian.Setting(containerEl)
      .setName('Log Mode')
      .setDesc('How should calendar clicks interact with your vault?')
      .addDropdown(dropdown => dropdown
        .addOption('single', 'Single Master File')
        .addOption('multi', 'One File Per Day')
        .setValue(this.plugin.settings.logMode)
        .onChange(async (value) => {
          this.plugin.settings.logMode = value;
          await this.plugin.saveSettings();
          this.display();
        })
      );

    if (this.plugin.settings.logMode === 'single') {
      containerEl.createEl('h3', { text: 'Single Master File Settings' });

      new obsidian.Setting(containerEl)
        .setName('Target Master File Path')
        .setDesc('Path to the single master file (e.g. 02 Personal/Log/Daily Log.md)')
        .addText(text => text
          .setPlaceholder('02 Personal/Log/Daily Log.md')
          .setValue(this.plugin.settings.targetFilePath)
          .onChange(async (value) => {
            this.plugin.settings.targetFilePath = value;
            await this.plugin.saveSettings();
          }));

      new obsidian.Setting(containerEl)
        .setName('Header Date Format')
        .setDesc('Moment format for injected header strings')
        .addText(text => text
          .setPlaceholder('YYYY-MM-DD - dddd, MMMM D, YYYY')
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value) => {
            this.plugin.settings.dateFormat = value;
            await this.plugin.saveSettings();
          }));

      new obsidian.Setting(containerEl)
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

      new obsidian.Setting(containerEl)
        .setName('Daily Logs Folder')
        .setDesc('Folder where daily files are created')
        .addText(text => text
          .setPlaceholder('02 Personal/Log')
          .setValue(this.plugin.settings.multiModeFolder)
          .onChange(async (value) => {
            this.plugin.settings.multiModeFolder = value;
            await this.plugin.saveSettings();
          }));

      new obsidian.Setting(containerEl)
        .setName('Daily Note File Format')
        .setDesc('Moment format for the file name (e.g. YYYY-MM-DD)')
        .addText(text => text
          .setPlaceholder('YYYY-MM-DD')
          .setValue(this.plugin.settings.multiModeFormat)
          .onChange(async (value) => {
            this.plugin.settings.multiModeFormat = value;
            await this.plugin.saveSettings();
          }));

      new obsidian.Setting(containerEl)
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

class UnifiedDailyCalendarPlugin extends obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_CALENDAR, (leaf) => new CalendarView(leaf, this));

    this.addRibbonIcon('calendar-days', 'Open Unified Calendar', () => {
      this.activateView();
    });

    this.addCommand({
      id: 'open-unified-daily-calendar',
      name: 'Open Calendar View',
      callback: () => { this.activateView(); }
    });

    this.addSettingTab(new UnifiedCalendarSettingTab(this.app, this));
  }

  async activateView() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
    await this.app.workspace.getRightLeaf(false).setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0]);
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
    if (leaves.length > 0) {
      const view = leaves[0].view;
      await view.refreshExistingDates();
      view.renderCalendar();
    }
  }

  async handleDateClick(dateObj) {
    if (this.settings.logMode === 'single') {
      await this.handleSingleFileMode(dateObj);
    } else {
      await this.handleMultiFileMode(dateObj);
    }
  }

  async handleMultiFileMode(dateObj) {
    const folderPath = this.settings.multiModeFolder;
    const fileName = dateObj.format(this.settings.multiModeFormat) + ".md";
    const fullPath = obsidian.normalizePath(`${folderPath}/${fileName}`);

    let file = this.app.vault.getAbstractFileByPath(fullPath);

    if (file instanceof obsidian.TFile) {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
    } else {
      let content = "";
      const templatePath = this.settings.multiModeTemplate;
      if (templatePath) {
        const tplFile = this.app.vault.getAbstractFileByPath(obsidian.normalizePath(templatePath));
        if (tplFile instanceof obsidian.TFile) {
          content = await this.app.vault.read(tplFile);
        } else {
          new obsidian.Notice("Template file not found. Creating empty daily note.");
        }
      }

      try {
        const folder = this.app.vault.getAbstractFileByPath(obsidian.normalizePath(folderPath));
        if (!folder) {
          await this.app.vault.createFolder(obsidian.normalizePath(folderPath));
        }

        const newFile = await this.app.vault.create(fullPath, content);
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(newFile);

        if (leaf.view instanceof obsidian.MarkdownView) {
          const editor = leaf.view.editor;
          const lastLine = editor.lineCount() - 1;
          editor.setCursor({ line: lastLine, ch: editor.getLine(lastLine).length });
          editor.focus();
        }
      } catch (e) {
        new obsidian.Notice("Error creating daily note: " + e.message);
      }
    }
  }

  async handleSingleFileMode(dateObj) {
    const filePath = obsidian.normalizePath(this.settings.targetFilePath);
    const abstractFile = this.app.vault.getAbstractFileByPath(filePath);

    if (!abstractFile || !(abstractFile instanceof obsidian.TFile)) {
      new obsidian.Notice(`Target master file not found: ${filePath}`);
      return;
    }

    const targetFile = abstractFile;
    const fileContent = await this.app.vault.read(targetFile);

    const dateStr = dateObj.format('YYYY-MM-DD');
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
        const tplFile = this.app.vault.getAbstractFileByPath(obsidian.normalizePath(templatePath));
        if (tplFile instanceof obsidian.TFile) {
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

  async navigateToFileAndLine(file, lineNum) {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);

    if (leaf.view instanceof obsidian.MarkdownView) {
      const editor = leaf.view.editor;
      editor.setCursor({ line: lineNum, ch: 0 });
      editor.focus();
      leaf.view.currentMode.applyScroll(lineNum);
    }
  }
}

module.exports = UnifiedDailyCalendarPlugin;
