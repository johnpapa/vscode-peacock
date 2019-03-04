# vscode-peacock README

[![Badge for version for Visual Studio Code extension johnpapa.vscode-peacock](https://vsmarketplacebadge.apphb.com/version/johnpapa.vscode-peacock.svg?color=blue&style=?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock&wt.mc_id=github-oss-jopapa)

A Visual Studio Code extension that subtly changes the workspace color of your workspace. Ideal when you have multiple VS Code instances and you want to quickly identify which is which.

## Install

1. Open **Extensions** sidebar panel in Visual Studio Code. `View → Extensions`
1. Search for `Peacock`
1. Click **Install**
1. Click **Reload**, if required

## Features

Commands can be found in the command palette. Look for commands beginning with `Peacock:`

- Change the color of "affectedElements" (see `peacock.affectedElements` in the Properties section) to
  - user defined color
  - a random color
  - the primary color for angular, vue, or react
- Saves colors to your workspace in the `.vscode/settings.json` file
- Sets the foreground to light `#e7e7e7` and dark `#15202b` based on the contrast for the background color

## Properties

| Property                   | Description                                     |
| -------------------------- | ----------------------------------------------- |
| peacock.affectedElements   | prefixes of elements affected by peacock        |
| peacock.elementAdjustments | fine tune coloring of affected elements         |
| peacock.darkForeground     | override for the dark foreground                |
| peacock.lightForeground    | override for the light foreground               |
| peacock.preferredColors    | array of objects for color names and hex values |

### Preferred Colors

After setting 1 or more colors (hex or named) in the user setting for `peacock.preferredColors`, you can select `Peacock: Change to a Preferred Color` and you will be prompted with the list from `peacock.preferredColors` from user settings.

```text
Gatsby Purple -> #123456
Auth0 Orange -> #eb5424
Azure Blue -> #007fff
```

Preferred colors require a user-defined name (`name`) and a value ( `value` ), as shown in the example below.

```javascript
  "peacock.preferredColors": [
    { "name": "Gatsby Purple", "value": "#639" },
    { "name": "Auth0 Orange", "value": "#eb5424" },
    { "name": "Azure Blue", "value": "#007fff" }
  ]
```

![Animated GIF](./resources/named-colors.gif)

### Affected Elements

You can tell peacock which parts of VS Code will be affected by when you select a color. You can do this by checking the appropriate setting that applies to the elements you want to be colored. The choices are:

![Animated GIF](./resources/affected-settings.jpg)

### Element Adjustments

You can fine tune the coloring of affected elements by making them slightly darker or lighter to provide a subtle visual contrast between them. Options for adjusting elements are:

- `"darken"`: reduces the value of the selected color to make it slightly darker
- `"lighten"`: increases the value of the selected color to make it slightly lighter
- `"none"`: no adjustment will be made to the selected color

An example of using this might be to make the Activity Bar slightly lighter than the Status Bar and Title Bar to better visually distinguish it as present in several popular themes. This can be achieved with the setting in the example below.

```javascript
  "peacock.affectActivityBar": true,
  "peacock.affectStatusBar": true,
  "peacock.affectTitleBar": true,
  "peacock.elementAdjustments" {
    "activityBar": "lighten"
  }
```

When using peacock with the React Blue color, this results in the Activity Bar being slightly lighter than the Status Bar and Title Bar:

![Animated GIF](./resources/element-adjustments.png)

## Commands

| Command                       | Description                                                              |
| ----------------------------- | ------------------------------------------------------------------------ |
| Peacock: Reset Colors         | Removes any of the color settings from the `.vscode/setttings.json` file |
| Peacock: Enter a Color        | Prompts you to enter a color (see [input formats](#input-formats))       |
| Peacock: Color to Vue Green   | Sets the color to Vue.js's main color, #42b883                           |
| Peacock: Color to Angular Red | Sets the color to Angular's main color, #b52e31                          |
| Peacock: Color to React Blue  | Sets the color to React.js's main color, #00b3e6                         |
| Peacock: Color to Random      | Sets the color to a random color                                         |

## Input Formats

When entering a color in Peacock several formats are acceptable. These include

| Format            | Examples                                         |
| ----------------- | ------------------------------------------------ |
| Named HTML colors | purple, blanchedalmond                           |
| Short Hex         | #8b2, f00                                        |
| Short Hex8 (RGBA) | #8b2c, f00c                                      |
| Hex               | #88bb22, ff0000                                  |
| Hex8 (RGBA)       | #88bb22cc, ff0000cc                              |
| RGB               | rgb (136, 187, 34), rgb 255 0 0                  |
| RGBA              | rgba (136, 187, 34, .8), rgba 255 0 0 .8         |
| HSL               | hsl (80, 69%, 43%), hsl (0 1 .5)                 |
| HSLA              | hsla (80, 69%, 43%, 0.8), hsla (0 1 .5 .8)       |
| HSV               | hsv (80, 82%, 73%), hsv (0 1 1)                  |
| HSVA              | hsva (80, 82%, 73%, 0.8), hsva (0,100%,100%,0.8) |

All formats offer flexible data validation:

- For named HTML colors, case is insensitive
- For any hex value, the `#` is optional.
- For any color formula value all parentheses and commas are optional and any number can be a decimal or percentage (with the exception of the alpha channel in rgba(), hsla(), and hsva() which must be a decimal between 0 and 1).

## Roadmap

There are may features in the roadmap. Please refer to the [issues list and feel free to grab one and contribute](https://github.com/johnpapa/vscode-peacock/issues)!

## Changes

See the [CHANGELOG](CHANGELOG.md) for the latest changes.

## Credits

Inspiration comes in many forms. These folks and teams have contributed either through ideas, issues, pull requests, or guidance. Thank you!

- The VS Code team and their incredibly [helpful guide for creating extensions](https://code.visualstudio.com/api/get-started/your-first-extension?wt.mc_id=github-oss-jopapa)

- Here are some great [examples for extensions](https://github.com/Microsoft/vscode-extension-samples) from the VS Code team

Key Contributors of PRs:

- [@josephrexme](https://twitter.com/josephrexme) for the name
- [@musicfuel](https://twitter.com/musicfuel) for the icon
- Implemented reset for each settings that isn't selected (by <https://github.com/souzara>)

Key Contributors of issues, reviews, and/or ideas:

- [@codebeast](https://twitter.com/codebeast), [@\_clarkio](https://twitter.com/_clarkio), [@burkeholland](https://twitter.com/burkeholland), [JulianG](https://github.com/JulianG),[@samjulien](https://twitter.com/samjulien),
[@kushalpanda](https://twitter.com/kushalpanda)

![Sketchnote](./resources/peacock-sketchnote.png)

## Try the Code

If you want to try the extension out start by cloning this repo, `cd` into the folder, and then run `npm install`.

Then you can run the debugger for the launch configuration `Run Extension`. Set breakpoints, step through the code, and enjoy!
