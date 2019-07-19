# Peacock for Visual Studio Code

![Peacock Icon](./resources/peacock-icon-small.png 'Peacock')

Subtly change the color of your Visual Studio Code workspace. Ideal when you have multiple VS Code instances, use VS Live Share, or use VS Code's Remote features, and you want to quickly identify your editor.

| Badges                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![All Contributors](https://img.shields.io/badge/all_contributors-15-orange.svg?style=flat-square)](#contributors)                                                                                                                                                                                                                         |
| [![Badge for version for Visual Studio Code extension johnpapa.vscode-peacock](https://vsmarketplacebadge.apphb.com/version/johnpapa.vscode-peacock.svg?color=blue&style=?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock&wt.mc_id=vscodepeacock-github-jopapa) |
| [![Installs](https://vsmarketplacebadge.apphb.com/installs-short/johnpapa.vscode-peacock.svg?color=blue&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock&wt.mc_id=vscodepeacock-github-jopapa)                                                                                             |
| [![Rating](https://vsmarketplacebadge.apphb.com/rating/johnpapa.vscode-peacock.svg?color=blue&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock&wt.mc_id=vscodepeacock-github-jopapa)                                                                                                       |
| [![Live Share](https://img.shields.io/badge/Live_Share-enabled-8F80CF.svg?color=blue&style=flat-square&logo=visual-studio-code)](https://visualstudio.microsoft.com/services/live-share/?wt.mc_id=vscodepeacock-github-jopapa)                                                                                                            |
| [![The MIT License](https://img.shields.io/badge/license-MIT-orange.svg?color=blue&style=flat-square)](http://opensource.org/licenses/MIT)                                                                                                                                                                                                |
| [![Greenkeeper badge](https://badges.greenkeeper.io/johnpapa/vscode-peacock.svg)](https://greenkeeper.io/)                                                                                                                                                                                                                                |
| [![Build Status](https://johnpapa.visualstudio.com/vscode-peacock/_apis/build/status/VS%20Code%20Peacock%20Extension?branchName=master)](https://johnpapa.visualstudio.com/vscode-peacock/_build/latest?definitionId=3&branchName=master)                                                                                                 |

## Install

1. Open **Extensions** sidebar panel in Visual Studio Code. `View → Extensions`
1. Search for `Peacock`
1. Click **Install**
1. Click **Reload**, if required

![Peacock Windows](./resources/peacock-windows.png 'Peacock Windows')

## Features

Commands can be found in the command palette. Look for commands beginning with `Peacock:`

- Change the color of [Affected Elements](#Affected-Elements) (see `peacock.affect*` in the [Settings](#Settings) section) to
  - [user defined color](#Input-Formats)
  - a random color
- Select a user-defined color from your [Favorite Colors](#Favorite-Colors)
- Save a user-defined color with the [Save Favorite Color](#Save-Favorite-Color)
- [Adjust the coloring of affected elements](#Element-Adjustments) by making them slightly darker or lighter to provide a subtle visual contrast between them
- Saves colors to your workspace in the `.vscode/settings.json` file
- Integrates with [Live Share](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare&wt.mc_id=vscodepeacock-github-jopapa).
- Integrates with [VS Code Remote](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack&wt.mc_id=vscodepeacock-github-jopapa).

## Settings

| Property                            | Description                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| peacock.affectActivityBar           | Specifies whether Peacock should affect the activity bar                                                |
| peacock.affectStatusBar             | Specifies whether Peacock should affect the status bar                                                  |
| peacock.affectTitleBar              | Specifies whether Peacock should affect the title bar (see [title bar coloring](#title-bar-coloring))   |
| peacock.elementAdjustments          | fine tune coloring of affected elements                                                                 |
| peacock.favoriteColors              | array of objects for color names and hex values                                                         |
| peacock.keepForegroundColor         | Specifies whether Peacock should change affect colors                                                   |
| peacock.surpriseMeOnStartup         | Specifies whether Peacock apply a random color on startup                                               |
| peacock.darkForeground              | override for the dark foreground                                                                        |
| peacock.lightForeground             | override for the light foreground                                                                       |
| peacock.darkenLightenPercentage     | the percentage to darken or lighten the color                                                           |
| peacock.surpriseMeFromFavoritesOnly | Specifies whether Peacock should choose a random color from the favorites list or a purely random color |

### Favorite Colors

After setting 1 or more colors (hex or named) in the user setting for `peacock.favoriteColors`, you can select `Peacock: Change to a Favorite Color` and you will be prompted with the list from `peacock.favoriteColors` from user settings.

```text
Gatsby Purple -> #123456
Auth0 Orange -> #eb5424
Azure Blue -> #007fff
```

Favorite colors require a user-defined name (`name`) and a value ( `value` ), as shown in the example below.

```javascript
  "peacock.favoriteColors": [
    { "name": "Gatsby Purple", "value": "#639" },
    { "name": "Auth0 Orange", "value": "#eb5424" },
    { "name": "Azure Blue", "value": "#007fff" }
  ]
```

> You can find brand color hex codes from <https://brandcolors.net>

#### Preview Your Favorite

When opening the Favorites command in the command palette, Peacock now previews (applies) the color as you cycle through them. If you cancel (press ESC), your colors revert to what you had prior to trying the Favorites command

![Animated GIF](./resources/named-colors.gif)

#### Save Favorite Color

When you apply a color you enjoy, you can go to the workspace `settings.json` and copy the color's hex code, then create your own favorite color in your user `settings.json`. This involves a few manual steps and arguably is not obvious at first.

The `Peacock: Save Current Color as Favorite Color` feature allows you to save the currently set color as a favorite color, and prompts you to name it.

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
  "peacock.elementAdjustments": {
    "activityBar": "lighten"
  }
```

This results in the Activity Bar being slightly lighter than the Status Bar and Title Bar (see below).

![Animated GIF](./resources/element-adjustments.png)

### Keep Foreground Color

Recommended to remain `false` (the default value).

When set to true Peacock will not colorize the foreground of any of the affected elements and will only alter the background. Some users may desire this if their theme's foreground is their preference over Peacock. In this case, when set to true, the foreground will not be affected.

### Surprise Me On Startup

Recommended to remain `false` (the default value).

When set to true Peacock will automatically apply a random color when opening a workspace that does not define color customizations. This can be useful if you frequently open many instances of VS Code and you are interested in identifying them, but are not overly committed to the specific color applied.

If this setting is `true` and there is no peacock color set, then Peacock will choose a new color. If there is already a color set, Peacock will not choose a random color as this would prevent users from choosing a specific color for some workspaces and surprise in others.

### Lighten and Darken

You may like a color but want to lighten or darken it. You can do this through the corresponding [commands](#Commands). When you choose one of these commands the current color will be lightened or darkened by the percentage that is in the `darkenLightenPercentage` setting. You may change this setting to be a value between 1 and 10 percent.

There are key bindings for the lighten command `alt+cmd+=` and for darken command `alt+cmd+-`, to make it easier to adjust the colors.

## Commands

| Command                                  | Description                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| Peacock: Reset Colors                    | Removes any of the color settings from the `.vscode/settings.json` file |
| Peacock: Enter a Color                   | Prompts you to enter a color (see [input formats](#input-formats))      |
| Peacock: Color to Peacock Green          | Sets the color to Peacock main color, #42b883                           |
| Peacock: Surprise me with a Random Color | Sets the color to a random color                                        |
| Peacock: Change to a Favorite Color      | Prompts user to select from their Favorites                             |
| Peacock: Save Current Color to Favorites | Save Current Color to their Favorites                                   |
| Peacock: Add Recommended Favorites       | Add the recommended favorites to user settings (override same names)    |
| Peacock: Darken                          | Darkens the current color by `darkenLightenPercentage`                  |
| Peacock: Lighten                         | Lightens the current color by `darkenLightenPercentage`                 |

## Integrations

### VS Live Share Integration

![Animated GIF](./resources/peacock-live-share-demo.gif)

Peacock detects when the [Live Share](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare&wt.mc_id=vscodepeacock-github-jopapa) extension is installed and automatically adds two commands that allow the user to change color of their Live Share sessions as a Host or a Guest, depending on their role.

| Command                                  | Description                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| Peacock: Change Live Share Color (Host)  | Prompts user to select a color for Live Share Host session from the Favorites  |
| Peacock: Change Live Share Color (Guest) | Prompts user to select a color for Live Share Guest session from the Favorites |

When a [Live Share](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare&wt.mc_id=vscodepeacock-github-jopapa) session is started, the selected workspace color will be applied. When the session is finished, the workspace color is reverted back to the previous one (if set).

- Learn more about [Live Share](https://code.visualstudio.com/blogs/2017/11/15/live-share?wt.mc_id=vscodepeacock-github-jopapa)
- Get the [Live Share extension](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare&wt.mc_id=vscodepeacock-github-jopapa)
- Get the [Live Share extension pack](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare-pack&wt.mc_id=vscodepeacock-github-jopapa), which now includes Peacock

### Remote Development Integration

Peacock integrates with the Remote Development features of VS Code.

- Learn more about [VS Code Remote Development](https://code.visualstudio.com/blogs/2019/05/02/remote-development?wt.mc_id=vscodepeacock-github-jopapa)
- Get the [VS Code Remote Development Extensions](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack&wt.mc_id=vscodepeacock-github-jopapa)

Peacock detects when the [VS Code Remote](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) extension is installed and adds commands that allow the user to change color depending on the remote context (container, ssh, wsl).

| Command                                   | Description                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Peacock: Change Remote Color (SSH)        | Prompts user to select a color for the SSH remote context from the Favorites        |
| Peacock: Change Remote Color (Containers) | Prompts user to select a color for the Containers remote context from the Favorites |
| Peacock: Change Remote Color (WSL)        | Prompts user to select a color for the WSL remote context from the Favorites        |

When a workspace is opened in a remote context, the selected workspace color will be applied.

VS Code distinguishes two classes of extensions: UI Extensions and Workspace Extensions. Peacock is classified as a UI extension as it makes contributions to the VS Code user interface and is always run on the user's local machine. UI Extensions cannot directly access files in the workspace, or run scripts/tools installed in that workspace or on the machine. Example UI Extensions include: themes, snippets, language grammars, and keymaps.

In version 2.1.2 Peacock enabled integration with the Remote Development by adding `"extensionKind": "ui"` in the extension's `package.json`.

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

There are many features in the roadmap. Please refer to the [issues list and feel free to grab one and contribute](https://github.com/johnpapa/vscode-peacock/issues)!

## Changes

See the [CHANGELOG](CHANGELOG.md) for the latest changes.

## FAQ

### Peacock Behavior

Peacock affects:

- the titlebar, activitybar, and statusbar elements
- anything regarding the readability of these elements
- background and foreground colors
- any elements that are displayed within these peacock elements (e.g. badges, hover)

### Changing User Settings

When any Peacock setting is changed, Peacock should update the colors appropriately based on the most recently used color during the active VS Code instance's session.

#### Example 1

User selects a color, then later changes which elements are affected.

1. User chooses "surprise me" and sets the color to #ff0000
1. Peacock saves #ff0000 in memory as the most recently used color
1. User goes to settings and unchecks the "Peacock: Affect StatusBar"
1. Peacock listens to this change, clears all colors and reapplies the #ff0000

#### Example 2

User opens VS Code, already has colors in their workspace, and immediately changes which elements are affected.

1. User opens VS Code
1. Workspace colors are set to #369
1. User goes to settings and unchecks the "Peacock: Affect StatusBar"
1. Peacock listens to this change, clears all colors and reapplies the #369

#### Example 3

User opens VS Code, has no colors in workspace, and immediately changes which elements are affected.

1. User opens VS Code
1. No workspace colors are set
1. Peacock's most recently used color is not set
1. User goes to settings and unchecks the "Peacock: Affect StatusBar"
1. Peacock listens to this change, however no colors are applied

### Title Bar Coloring

The VS Code Title Bar style can be configured to be custom or native with the `window.titleBarStyle` setting. When operating in native mode, Peacock is unable to colorize the Title Bar because VS Code defers Title Bar management to the OS. In order to leverage the Affect Title Bar setting to colorize the Title Bar, the `window.titleBarStyle` must be set to custom.

On macOS there are additional settings that can impact the Title Bar style and force it into native mode regardless of the `window.titleBarStyle` setting. These include:

- `window.nativeTabs` should be set to **false**. If using native tabs, the rendering of the title bar is deferred to the OS and native mode is forced.
- `window.nativeFullScreen` should be set to **true**. If not using native full screen mode, the custom title bar rendering presents issues in the OS and native mode is forced.

A successful and recommended settings configuration to colorize the Title Bar is:

![Title Bar Settings](./resources/title-bar-coloring-settings.png)

### How Foreground Colors are Calculated

Peacock is using tinycolor which provides some basic color theory mechanisms to determine whether or not to show a light or dark foreground color based on the perceived brightness of the background. More or less, if it thinks the background is darker than 50% then Peacock uses the light foreground. If it thinks the background is greater than 50% then Peacock uses the dark foreground.

Brightness is measured on a scale of 0-255 where a value of 127.5 is perfectly 50%.

Example:

```javascript
const lightForeground = '#e7e7e7';
const darkForegound = '#15202b';
const background = '#498aff';

const perceivedBrightness = tinycolor(background).getBrightness(); // 131.903, so 51.7%
const isDark = tinycolor(background).isDark(); // false, since brightness is above 50%
const textColor = isDark ? lightForeground : darkForeground; // We end up using dark text
```

This particular color (`#498aff`) is very near 50% on the perceived brightness, but the determination is binary so the color is either light or dark based on which side of 50% it is (exactly 50% is considered as light by the library). For the particular color `#498aff`, all of the theory aspects that tinycolor provides show that using the dark foreground is the right approach.

```javascript
const readability = tinycolor.readability(darkForeground, background); // 4.996713
const isReadable = tinycolor.isReadable(darkForeground, background); // true
```

The readability calculations and metrics are based on Web Content Accessibility Guidelines (Version 2.0) and, in general, a ratio close to 5 is considered good based on that information. If we run the lightForeground through the same algorithm you can see that readability actually suffers with a reduced contrast ratio:

```javascript
const readability = tinycolor.readability(lightForeground, background); // 2.669008
const isReadable = tinycolor.isReadable(lightForeground, background); // false
```

### Recommended Favorites

Recommended favorites are a list of constants found in `favorites.ts`. These are alphabetized.

Recommended favorites are a starting point for favorites. They will be installed whenever a new version is installed. They will extend your existing favorites, so feel free to continue to add to your local favorites! However be careful not to change the color of the recommended favorites as they will be overridden when a new version is installed.

This list may change from version to version depending on the Peacock authoring team.

### Mementos

Peacock takes advantage of a series of mementos (values stored between sessions and not in settings). Some are global that affect all VS Code instances on the computer. Some are local to the workspace on the computer.

| Name                                        | Type      | Description                                                                                                             |
| ------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| peacockMementos.peacockColor                | Workspace | The most recently used Peacock color, but not remote or other secondary colors. Ideal when moving in and out of remote. |
| peacockMementos.favoritesVersion            | Global    | The version of Peacock. Helps identify when the list of favorites should be written to the user's settings              |
| peacockVslsMementos.vslsJoinColor           | Global    | VS Live Share's Peacock color when joining a session.                                                                   |
| peacockVslsMementos.vslsShareColor          | Global    | VS Live Share's Peacock color when sharing a session.                                                                   |
| peacockRemoteMementos.remoteContainersColor | Global    | Peacock color when in a remote with a container.                                                                        |
| peacockRemoteMementos.remoteSshColor        | Global    | Peacock color when using remote with ssh.                                                                               |
| peacockRemoteMementos.remoteWslColor        | Global    | Peacock color when using remote with WSL                                                                                |

![Sketchnote](./resources/peacock-sketchnote.png)

## Try the Code

If you want to try the extension out start by cloning this repo, `cd` into the folder, and then run `npm install`.

Then you can run the debugger for the launch configuration `Run Extension`. Set breakpoints, step through the code, and enjoy!

## Resources

- [Get VS Code](https://code.visualstudio.com/?wt.mc_id=peacock-github-jopapa)
- [Create your first VS Code extension](https://code.visualstudio.com/api/get-started/your-first-extension?wt.mc_id=peacock-github-jopapa)
- [VS Code Extension API](https://code.visualstudio.com/api/references/vscode-api?wt.mc_id=peacock-github-jopapa)
- [Learn how to add WebPack bundles to your favorite extensions](https://code.visualstudio.com/updates/v1_32#_bundling-extensions-with-webpack?wt.mc_id=peacock-github-jopapa)

## Credits

Inspiration comes in many forms. These folks and teams have contributed either through ideas, issues, pull requests, or guidance. Thank you!

- The VS Code team and their incredibly [helpful guide for creating extensions](https://code.visualstudio.com/api/get-started/your-first-extension?wt.mc_id=vscodepeacock-github-jopapa)

- Here are some great [examples for extensions](https://github.com/Microsoft/vscode-extension-samples) from the VS Code team

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/musicfuel"><img src="https://avatars1.githubusercontent.com/u/1085791?v=4" width="100px;" alt="James Newell"/><br /><sub><b>James Newell</b></sub></a><br /><a href="https://github.com/johnpapa/vscode-peacock/commits?author=musicfuel" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://juliangaramendy.dev"><img src="https://avatars1.githubusercontent.com/u/237818?v=4" width="100px;" alt="Julian"/><br /><sub><b>Julian</b></sub></a><br /><a href="#ideas-JulianG" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://twitter.com/legomushroom"><img src="https://avatars2.githubusercontent.com/u/1478800?v=4" width="100px;" alt="Oleg Solomka"/><br /><sub><b>Oleg Solomka</b></sub></a><br /><a href="https://github.com/johnpapa/vscode-peacock/commits?author=legomushroom" title="Code">💻</a> <a href="https://github.com/johnpapa/vscode-peacock/commits?author=legomushroom" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://josephrex.me"><img src="https://avatars3.githubusercontent.com/u/5395567?v=4" width="100px;" alt="Joseph Rex"/><br /><sub><b>Joseph Rex</b></sub></a><br /><a href="#design-josephrexme" title="Design">🎨</a></td>
    <td align="center"><a href="http://www.samjulien.com"><img src="https://avatars1.githubusercontent.com/u/7738189?v=4" width="100px;" alt="Sam Julien"/><br /><sub><b>Sam Julien</b></sub></a><br /><a href="#ideas-samjulien" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://www.tattoocoder.com"><img src="https://avatars1.githubusercontent.com/u/7681382?v=4" width="100px;" alt="Shayne Boyer"/><br /><sub><b>Shayne Boyer</b></sub></a><br /><a href="https://github.com/johnpapa/vscode-peacock/commits?author=spboyer" title="Code">💻</a></td>
    <td align="center"><a href="http://a.shinynew.me"><img src="https://avatars1.githubusercontent.com/u/686963?v=4" width="100px;" alt="Burke Holland"/><br /><sub><b>Burke Holland</b></sub></a><br /><a href="#ideas-burkeholland" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://www.lostintangent.com"><img src="https://avatars3.githubusercontent.com/u/116461?v=4" width="100px;" alt="Jonathan Carter"/><br /><sub><b>Jonathan Carter</b></sub></a><br /><a href="https://github.com/johnpapa/vscode-peacock/commits?author=lostintangent" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/souzara"><img src="https://avatars2.githubusercontent.com/u/11986361?v=4" width="100px;" alt="Ricardo Souza"/><br /><sub><b>Ricardo Souza</b></sub></a><br /><a href="https://github.com/johnpapa/vscode-peacock/commits?author=souzara" title="Code">💻</a></td>
    <td align="center"><a href="https://doublslash.com"><img src="https://avatars1.githubusercontent.com/u/1748044?v=4" width="100px;" alt="Kushal Pandya"/><br /><sub><b>Kushal Pandya</b></sub></a><br /><a href="https://github.com/johnpapa/vscode-peacock/commits?author=kushalpandya" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/egamma"><img src="https://avatars1.githubusercontent.com/u/172399?v=4" width="100px;" alt="Erich Gamma"/><br /><sub><b>Erich Gamma</b></sub></a><br /><a href="https://github.com/johnpapa/vscode-peacock/commits?author=egamma" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/christiannwamba"><img src="https://avatars2.githubusercontent.com/u/8108337?v=4" width="100px;" alt="Christian Nwamba"/><br /><sub><b>Christian Nwamba</b></sub></a><br /><a href="#ideas-christiannwamba" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://mattbierner.com"><img src="https://avatars2.githubusercontent.com/u/12821956?v=4" width="100px;" alt="Matt Bierner"/><br /><sub><b>Matt Bierner</b></sub></a><br /><a href="https://github.com/johnpapa/vscode-peacock/commits?author=mjbvz" title="Code">💻</a></td>
    <td align="center"><a href="https://www.raymondcamden.com"><img src="https://avatars3.githubusercontent.com/u/393660?v=4" width="100px;" alt="Raymond Camden"/><br /><sub><b>Raymond Camden</b></sub></a><br /><a href="#ideas-cfjedimaster" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://www.aaron-powell.com"><img src="https://avatars0.githubusercontent.com/u/434140?v=4" width="100px;" alt="Aaron Powell"/><br /><sub><b>Aaron Powell</b></sub></a><br /><a href="#ideas-aaronpowell" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
