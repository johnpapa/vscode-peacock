# Change Log

All notable changes to the code will be documented in this file.

## [0.2.0]

Features

- Updated Peacock logo
- Added support for [HTML color names](https://www.w3schools.com/colors/colors_names.asp).

## [0.1.1]

Features

- Added properties in settings for `peacock.lightForeground` and `peacock.darkForeground`
- Added defaults for light foreground `#e7e7e7` and dark foreground `#15202b`

Breaking Changes

- Renamed the property in settings from `peacock.affectedSettings` to `peacock.affectedElements`
- When there are no settings for `peacock.affectedElements`, the default is `titleBar`

Other Changes

- Refactored code in different modules
- Updated README

## [0.0.7]

Features

- Added ability to color the activityBar, statusBar, and titleBar
- Added the property `peacock.affectedElements` to allow affecting one or more of the following:
  - activityBar
  - statusBar
  - titleBar

Refactor

- Refactored all utility functions to `utils.ts`

## [0.0.5]

Features

- Added menu command to reset all colors (clears the workspace settings for the affected colors)
- Revised the prompt to guide on RGB format for hex values

Bug fixes

- Prompt for color now works when a file is not open.

## [0.0.4]

- Named **peacock**
- Allow changing to user defined color
- Allow changing to random color
- Allow changing color to angular, vue, or react primary colors
- Saves colors to your workspace
- Sets the foreground to white or black based on the contrast for the background color
- Add peacock icon
- Added README.md
- Made commands use `peacock:` prefix
