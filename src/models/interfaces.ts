import { ColorAdjustment, ElementNames } from './enums';

export interface ISettingsIndexer {
  [key: string]: any;
}

export interface IFavoriteColors {
  name: string;
  value: string;
}

export interface ICommand {
  title: string;
  command: string;
  category: string;
}

export interface IConfiguration {
  type: string;
  title: string;
  properties: any;
}

export interface IElementStyle {
  backgroundHex: string;
  backgroundHoverHex: string;
  foregroundHex: string;
  inactiveBackgroundHex: string;
  inactiveForegroundHex: string;
  badgeBackgroundHex?: string;
  badgeForegroundHex?: string;
}

export interface IPeacockAffectedElementSettings {
  activityBar: boolean;
  statusBar: boolean;
  titleBar: boolean;
  accentBorders: boolean;
  statusTitleBorders: boolean;
  tabActiveBorder: boolean;
}

export interface IPeacockElementAdjustments {
  [elementName: string]: ColorAdjustment;
}

export interface IPeacockSettings {
  affectedElements: IPeacockAffectedElementSettings;
  affectAccentBorders: boolean;
  affectStatusAndTitleBorders: boolean;
  elementAdjustments: IPeacockElementAdjustments;
  favoriteColors: IFavoriteColors[];
  keepBadgeColor: boolean;
  keepForegroundColor: boolean;
  darkForegroundColor: string;
  lightForegroundColor: string;
  darkenLightenPercentage: number;
  showColorInStatusBar: boolean;
  surpriseMeFromFavoritesOnly: boolean;
  surpriseMeOnStartup: boolean;
  color: string;
  remoteColor: string;
}

export interface IElementColors {
  [ElementNames.activityBar]: string;
  [ElementNames.statusBar]: string;
  [ElementNames.titleBar]: string;
}
