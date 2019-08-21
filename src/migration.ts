import { State, extensionShortName } from './models';
import { getCurrentColorBeforeAdjustments, getPeacockColor } from './configuration';
import { updateColorSetting } from './apply-color';
import { Logger } from './logging';

export async function migrateFromMementoToSettingsAsNeeded() {
  /**
   * Version >2.5 of Peacock did not store the peacock color.
   * Version 2.5 of Peacock stored the peacock color in a memento.
   * Version 3 of Peacock stores the color in the settings.
   * If peacock.color does not exist and we find either memento or a deried color,
   * remove the memento, and write the apply the color to the settings.
   *
   * @deprecated since version 3.0.
   * Will be deleted in version 4.0 and once v3.0 users have migrated
   */
  // If peacock.color exists, get out. Nothing to migrate.
  const peacockColorExists = !!getPeacockColor();
  if (peacockColorExists) {
    Logger.info('Migration: Nothing to migrate, peacock.color exists.');
    return;
  }
  // Check for the v2.5 memento
  const peacockColorMementoName = `${extensionShortName}.peacockColor`;
  const peacockColorMemento = State.extensionContext.workspaceState.get<string>(
    peacockColorMementoName,
  );
  let derivedColor = undefined;
  // The v2 memento is gone, so no need to migrate.
  if (peacockColorMemento) {
    Logger.info('Migration: Migrating from peacock memento to peacock.color setting.');
    // Remove the v2 memento (it's ok if it doesnt exist)
    await State.extensionContext.workspaceState.update(peacockColorMementoName, undefined);
  } else {
    /**
     * If there is no memento, check if there is a
     * color set in the 'old style' w/o the setting peacock.color.
     * If there is, then let's grab it and set it.
     */
    colorConfig = getColorCustomizationConfigFromWorkspace();
    derivedColor = getCurrentColorBeforeAdjustments() || undefined;
  }
  // Migrate the color that was in the v2 memento
  // or the derived color to the v3 workspace setting
  const color = peacockColorMemento || derivedColor;
  if (color) {
    // If we found something to migrate then do it
    Logger.info(`Migration: Applying color ${color}.`);
    await updateColorSetting(color);
  }
}
