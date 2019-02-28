# Change Log

All notable changes to the code will be documented in this file.

## 0.4.0

Features

- Refactored Preferred Colors to display the user-defined name of a color and the color value in a quick pick list.

The preferred colors require a custom name (`name`) and a value ( `value` ), as shown in the example below. See the README.md for details.

```javascript
  "peacock.preferredColors": [
    { "name": "Gatsby Purple", "value": "#639" },
    { "name": "Auth0 Orange", "value": "#eb5424" },
    { "name": "Azure Blue", "value": "#007fff" }
  ]
```

Bug Fix

- fixed bug where 3 character hex values were not working

## [0.3.0]

Features

- New setting for `peacock.preferredColors` that stores an array of strings for color names and hex values
- User can select `Peacock: Change to a Preferred Color` which prompts with the list from `peacock.preferredColors` from user settings

Other Changes

- Refactor modules to be clearer
- Refactor changeColor to enterColor for internal names of the command

## [0.2.1]

Features

- Updated Peacock logo
- Added support for [HTML color names](https://www.w3schools.com/colors/colors_names.asp).

Other Changes

- Implemented reset for each settings that isn't selected
- Added unit tests
- Updated README

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
