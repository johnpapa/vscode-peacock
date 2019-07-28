# Scenarios

Scenarios for Peacock.

## Local / Remote Settings Scenarios

This set of scenarios clarifies Peacock's intended behavior when in a remote or local environment, and how it affects:

- user and workspace settings for "peacock.color" and "peacock.remoteColor"
- workspace colorCustomizations

### A - Local / No User Settings / No Workspace Settings - [User Sets Local Color]

```json
// user settings
{}
```

```json
// workspace settings
{}
```

- open a project
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color". None exist, so we do nothing.
- User changes the color to #00ff00 (green)
- Peacock applies color customizations using #00ff00 (green)
- User changed the color so we want to write it.
- Peacock checks if "peacock.color" in workspace has changed. It has. So "peacock.color" is written to workspace.

```json
// user settings
{}
```

```json
// workspace settings
{
  "peacock.color": "#00ff00"
}
```

### B - Local / No User Settings / Workspace Color - [User Sets Local Color]

```json
// user settings
{}
```

```json
// workspace settings
{
  "peacock.color": "#00ff00"
}
```

- open a project
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color".
- Local workspace has "peacock.color" #00ff00
- Peacock applies color customizations using #00ff00 (green)
- Peacock checks if "peacock.color" in workspace is green. It is. So "peacock.color" is not written.

```json
// user settings
{}
```

```json
// workspace settings
{
  "peacock.color": "#00ff00"
}
```

- User changes the color to "#ffff00" (yellow)
- Peacock applies color customizations using #ffff00 (yellow)
- User changed the color so we want to write it.
- Peacock checks if "peacock.color" in workspace is yellow. It is not. So "peacock.color" is written to workspace.

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.color": "#00ffff"
}
```

### C - Local / User Settings Color / No Workspace Colors - [User Sets Local Color]

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{}
```

- open a project
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color".
- User-level settings has "peacock.color" #00ff00
- Peacock applies color customizations using #00ff00 (green)
- No user action was taken, so Peacock does not write the colors.

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{}
```

- User changes the color to "#ffff00" (yellow)
- Peacock applies color customizations using #ffff00 (yellow)
- User changed the color so we want to write it.
- Peacock checks if "peacock.color" in workspace is yellow. It is not. So "peacock.color" is written to workspace.

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.color": "#00ffff"
}
```

### D - Local / User Settings Color / Workspace Color - [User Sets Local Color]

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.color": "#00ffff"
}
```

- open a project
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color".
- Workspace settings has "peacock.color" #00ffff
- Peacock applies color customizations using #00ffff (yellow)
- No user action was taken, so Peacock does not write the colors.

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.color": "#00ffff"
}
```

- User changes the color to "#0000ff" (blue)
- Peacock applies color customizations using #0000ff (blue)
- User changed the color so we want to write it.
- Peacock checks if "peacock.color" in workspace is blue. It is not. So "peacock.color" is written to workspace.

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.color": "#0000ff"
}
```

### E - Local / User Settings Color / Workspace Color - [User Resets Colors]

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.color": "#00ffff"
}
```

- open a project
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color".
- Workspace settings has "peacock.color" #00ffff (yellow)
- Peacock applies color customizations using #00ffff (yellow)
- No user action was taken, so Peacock does not write the colors.

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.color": "#00ffff"
}
```

- User resets all colors
- Peacock removes all settings from workspace (color, remoteColor, colorCustomizations)

```json
// user settings
{}
```

```json
// workspace settings
{}
```

### F - Remote / No User Settings / No Workspace Settings - [User Sets Remote Color]

```json
// user settings
{}
```

```json
// workspace settings
{}
```

- open a project
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color". None exist, so we do nothing.
- User goes to remote environment
- Peacock sees we are in remote env., so it looks for workspace, then user settings for a "peacock.remoteColor". None exist, so we do nothing.
- User changes the color to #00ff00 (green)
- Peacock applies color customizations using #00ff00 (green)
- User changed the color so we want to write it.
- Peacock checks if "peacock.remoteColor" in workspace has changed. It has. So "peacock.remoteColor" is written to workspace.

```json
// user settings
{}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#00ff00"
}
```

### G - Remote / No User Settings / Workspace Color - [User Sets Remote Color]

```json
// user settings
{}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#00ff00"
}
```

- open a project
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color". None exist, so we do nothing.
- User goes to remote environment
- Peacock sees we are in remote env., so it looks for workspace, then user settings for a "peacock.remoteColor".
- Local workspace has "peacock.remoteColor" #00ff00 (green)
- Peacock applies color customizations using #00ff00 (green)
- Peacock checks if "peacock.remoteColor" in workspace is green. It is. So "peacock.remoteColor" is not written.

```json
// user settings
{}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#00ff00"
}
```

- User changes the color to "#ffff00" (yellow)
- Peacock applies color customizations using #ffff00 (yellow)
- User changed the color so we want to write it.
- Peacock checks if "peacock.remoteColor" in workspace is yellow. It is not. So "peacock.remoteColor" is written to workspace.

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#00ffff"
}
```

### H - Remote / User Settings Color / No Workspace Colors - [User Sets Remote Color]

```json
// user settings
{
  "peacock.remoteColor": "#00ff00"
}
```

```json
// workspace settings
{}
```

- open a project
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color". None exist, so we do nothing.
- User goes to remote environment
- User-level settings has "peacock.remoteColor" #00ff00
- Peacock applies color customizations using #00ff00 (green)
- No user action was taken, so Peacock does not write the colors.

```json
// user settings
{
  "peacock.remoteColor": "#00ff00"
}
```

```json
// workspace settings
{}
```

- User changes the color to "#ffff00" (yellow)
- Peacock applies color customizations using #ffff00 (yellow)
- User changed the color so we want to write it.
- Peacock checks if "peacock.remoteColor" in workspace is yellow. It is not. So "peacock.remoteColor" is written to workspace.

```json
// user settings
{
  "peacock.remoteColor": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#00ffff"
}
```

### I - Remote / User Settings Color / Workspace Color - [User Sets Remote Color]

```json
// user settings
{
  "peacock.remoteColor": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#00ffff"
}
```

- open a project
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color". None exist, so we do nothing.
- User goes to remote environment
- Peacock sees we are in remote env., so it looks for workspace, then user settings for a "peacock.remoteColor".
- Workspace settings has "peacock.remoteColor" #00ffff
- Peacock applies color customizations using #00ffff (yellow)
- No user action was taken, so Peacock does not write the colors.

```json
// user settings
{
  "peacock.remoteColor": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#00ffff"
}
```

- User changes the color to "#0000ff" (blue)
- Peacock applies color customizations using #0000ff (blue)
- User changed the color so we want to write it.
- Peacock checks if "peacock.remoteColor" in workspace is blue. It is not. So "peacock.remoteColor" is written to workspace.

```json
// user settings
{
  "peacock.remoteColor": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#0000ff"
}
```

### J - Remote / User Settings Color / Workspace Color - [User Resets Colors]

```json
// user settings
{
  "peacock.remoteColor": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#00ffff"
}
```

- open a project
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color". None exist, so we do nothing.
- User goes to remote environment
- Peacock sees we are in remote env., so it looks for workspace, then user settings for a "peacock.remoteColor".
- Workspace settings has "peacock.remoteColor" #00ffff (yellow)
- Peacock applies color customizations using #00ffff (yellow)
- No user action was taken, so Peacock does not write the colors.

```json
// user settings
{
  "peacock.remoteColor": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#00ffff"
}
```

- User resets all colors
- Peacock removes all settings from workspace (color, remoteColor, colorCustomizations)

```json
// user settings
{}
```

```json
// workspace settings
{}
```

### K - Local / User Settings Color / Workspace Color - [User Moves Local to Remote]

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.color": "#00ffff"
}
```

- open a project
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color".
- Workspace settings has "peacock.color" #00ffff
- Peacock applies color customizations using #00ffff (yellow)
- No user action was taken, so Peacock does not write the colors.

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.color": "#00ffff"
}
```

- User goes to remote env
- Peacock sees we are in remote env., so it looks for workspace, then user settings for a "peacock.remoteColor". None exist, so we do nothing.
- Color customizations from local are now also in the remote
- Nothing applied. Nothing written.

```json
// user settings
{
  "peacock.color": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.color": "#00ffff"
}
```

### L - Remote / User Settings Color / Workspace Color - [User Moves Remote to Local]

```json
// user settings
{
  "peacock.remoteColor": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#00ffff"
}
```

- open a project
- Peacock sees we are in remote env., so it looks for workspace, then user settings for a "peacock.remoteColor".
- Workspace settings has "peacock.remoteColor" #00ffff
- Peacock applies color customizations using #00ffff (yellow)
- No user action was taken, so Peacock does not write the colors.

```json
// user settings
{
  "peacock.remoteColor": "#00ff00"
}
```

```json
// workspace settings
{
  "peacock.remoteColor": "#00ffff"
}
```

- User goes to local env
- Peacock sees we are in local env., so it looks for workspace, then user settings for a "peacock.color". None exist, so we do nothing.
- Color customizations from remote are now also in the local
- Nothing applied. Nothing written.

```json
// user settings
{
  "peacock.remoteColor": "#00ff00"
}
```

```json
// workspace settings
{}
```
