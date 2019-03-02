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

| Property                 | Description                                     |
| ------------------------ | ----------------------------------------------- |
| peacock.affectedElements | prefixes of elements affected by peacock        |
| peacock.darkForeground   | override for the dark foreground                |
| peacock.lightForeground  | override for the light foreground               |
| peacock.preferredColors  | array of objects for color names and hex values |

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

## Commands

| Command                       | Description                                                              |
| ----------------------------- | ------------------------------------------------------------------------ |
| Peacock: Reset Colors         | Removes any of the color settings from the `.vscode/setttings.json` file |
| Peacock: Enter a Color        | Prompts you to enter a color using hex and RGB format or HTML color name |
| Peacock: Color to Vue Green   | Sets the color to Vue.js's main color, #42b883                           |
| Peacock: Color to Angular Red | Sets the color to Angular's main color, #b52e31                          |
| Peacock: Color to React Blue  | Sets the color to React.js's main color, #00b3e6                         |
| Peacock: Color to Random      | Sets the color to a random color                                         |

## Roadmap

There are may features in the roadmap. Please refer to the [issues list and feel free to grab one and contribute](https://github.com/johnpapa/vscode-peacock/issues)!

## Changes

See the [CHANGELOG](CHANGELOG.md) for the latest changes.

## Credits

Inspiration comes in many forms. These folks and teams have contributed either through ideas, issues, pull requests, or guidance. Thank you!

- the VS Code team and their incredibly [helpful guide for creating extensions](https://code.visualstudio.com/api/get-started/your-first-extension?wt.mc_id=github-oss-jopapa)

- Key Contributors of PRs:

  - [@josephrexme](https://twitter.com/josephrexme) for the name
  - [@musicfuel](https://twitter.com/musicfuel) for the icon
  - [@kushalpanda](https://twitter.com/kushalpanda) for the HTML color name support
  - Implemented reset for each settings that isn't selected (by <https://github.com/souzara>)

- Key Contributors of issues, reviews, and/or ideas:
  - [@codebeast](https://twitter.com/codebeast), [@\_clarkio](https://twitter.com/_clarkio), [@burkeholland](https://twitter.com/burkeholland), [JulianG](https://github.com/JulianG),[@samjulien](https://twitter.com/samjulien)

![Sketchnote](./resources/peacock-sketchnote.png)

## Try the Code

If you want to try the extension out start by cloning this repo, `cd` into the folder, and then run `npm install`.

Then you can run the debugger for the launch configuration `Run Extension`. Set breakpoints, step through the code, and enjoy!
