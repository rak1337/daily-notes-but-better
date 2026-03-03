# Daily Notes But Better

*All the calendar, none of the clutter. A beautiful Calendar view to manage daily entries in one master file.*

## The Problem (Why I created this)
Standard Daily Notes and Calendar plugins in Obsidian often enforce a strict **one-file-per-day** architecture. While this works for some, it forces others to generate hundreds or thousands of tiny, fragmented `.md` files over time. This creates immense clutter in your file explorer, breaks the flow of reading your daily thoughts as a contiguous journal, and makes reviewing past days disjointed.

## The Solution (How is this supposed to be used)
**Daily Notes But Better** provides a beautiful, fully functional Calendar View in your sidebar that lets you navigate and append your daily entries into a **single master file** (like `Daily Log.md`).

- **No Clutter:** Keeps your vault pristine by storing all your daily entries chronologically in one Markdown file.
- **Smart Chronology:** When you click a date on the calendar, the plugin scans your single file. If the entry exists, it jumps right to it. If it doesn't, it calculates *exactly* where that date belongs historically and explicitly inserts a new header for it—maintaining perfect reverse-chronological order.
- **Streak Dots:** The calendar automatically scans your master file and places indicator dots on days that have logged entries, letting you see your tracking streaks at a glance.
- **Dual-Mode Flexibility:** Prefer the old way for a specific project? You can toggle the plugin back to "One File Per Day" mode in settings, letting it act exactly like the traditional Calendar plugin.

## How to do the calendar view
Once the plugin is installed and activated:
1. Look at your left Obsidian Ribbon and click the **Calendar icon**. Alternatively, you can open the calendar view using `ctrl + p` and then type "open calendar view" and start clicking...
2. The Calendar will appear in your right sidebar.
3. You can click any day on the calendar, use the `<` and `>` arrows to browse through months, and see your activity dots indicating which days have entries.

## Usage
- **Click any day**: The plugin will instantly transport you to the appropriate line in your log file to start typing.
- **Automatic formatting**: The plugin automatically uses the header format you define in settings when creating a new date entry.
- **Template injection**: You can define a template in the settings that will be inserted whenever a new day is created.

## Installation

### From the Obsidian Community Plugins (Recommended)
You can install this plugin directly from within Obsidian:
1. Open Obsidian and go to **Settings** -> **Community Plugins**.
2. Turn off Safe Mode if it is enabled.
3. Click "Browse" and search for **Daily Notes But Better**.
4. Click **Install**.
5. Once installed, click **Enable**.

### Manual Installation (Using the Git Project)
If you prefer to install manually via GitHub:
1. Go to your vault's plugin directory: `.obsidian/plugins/` (note: `.obsidian` is a hidden folder).
2. Create a folder named `daily-notes-but-better`.
4. Open Obsidian and go to **Settings** -> **Community Plugins**.
5. Refresh the installed plugins list.
6. Find **Daily Notes But Better** and toggle it ON.
Alternatively, use `git clone https://github.com/g0dwyn/daily-notes-but-better.git` in the plugins directory and make sure the folder name exactly matches the ID (`daily-notes-but-better`).

## Configuration
Go to the plugin's Options. You will see a **Log Mode** dropdown:

### Mode 1: Single Master File (Default)
- Set your `Target Master File Path` to your chosen unified markdown file (e.g., `Log/Daily Log.md`).
- Define the `Date Format` for the headers injected into your master file.
- Set a Template path if you want specific content added when a new day is created.

### Mode 2: One File Per Day
- Switch `Log Mode` to "multi" if you prefer separate files.
- Set your `Daily Logs Folder` where you want individual notes placed.
- Set the `Multi-mode Date Format` (e.g., `YYYY-MM-DD`) which is used for the filenames.

...happy logging
