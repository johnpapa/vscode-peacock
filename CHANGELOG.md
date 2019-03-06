# Change Log

All notable changes to the code will be documented in this file.

## 0.7.0

Features

- Added `peacock.keepForegroundColor` setting, which specifies whether Peacock should change affect colors (see [Keep Foreground Color](./README.md#keep-foreground-color))

Other Changes

- Added and udpated all tests to respect the `keepForegroundColor` setting
- Refactored some functions to remove redundant code
- Added more setup and teardown code to the test suites
- Refactored tests to use arrow functions
- Refactored prepareColors function to collect the element settings using sub-functions for readability
- Created ISettingsIndexer to help indexing settings properties using enums

## 0.6.0

Features

- New setting for `peacock.elementAdjustments` that allows for slight value adjustments of affected elements to visually distinguish them from one another.
- Activity Bar icons now reflect current active state with the current activity in the foreground color and inactive activities indicated.
- Color entry now supports a larger variety of formats with more flexible entry restrictions (see [input formats](./README.md#input-formats) in [README](./README.md) for more information)

Other Changes

- Removed settings for dark and light foregrounds. Now defaults to DarkForeground = '15202b' and LightForeground = 'e7e7e7'. The value of these felt low vs the overhead of yet another setting
- Introduced the [tinycolor](https://www.npmjs.com/package/tinycolor2) library to handle color input validation, color conversion, and color manipulation
- Refactored much of the internal color library
- Added several unit tests for color input entry, affected elements, and element adjustments
- Updated README

## 0.5.0

Breaking Changes

Instead of an array, there are three separate configuration properties for the affected element settings:

```json
    "configuration": {
      "properties": {
        "peacock.affectTitleBar": {
          "type": "boolean",
          "default": true,
          "description": "Specifies whether Peacock should affect the title bar."
        },
        "peacock.affectActivityBar": {
          "type": "boolean",
          "default": false,
          "description": "Specifies whether Peacock should affect the activity bar."
        },
        "peacock.affectStatusBar": {
          "type": "boolean",
          "default": false,
          "description": "Specifies whether Peacock should affect the status bar."
        }
      }
    }
```

Other changes

- Refactored the constants, enums, and interfaces into a `models` folder in the code with a barrel for access

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
