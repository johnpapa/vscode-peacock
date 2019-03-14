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
}

export interface IPeacockElementAdjustments {
  [elementName: string]: ColorAdjustment;
}

export interface IPeacockSettings {
  affectedElements: IPeacockAffectedElementSettings;
  elementAdjustments: IPeacockElementAdjustments;
  favoriteColors: IFavoriteColors[];
  keepForegroundColor: boolean;
  surpriseMeOnStartup: boolean;
}

export interface IElementColors {
  [ElementNames.activityBar]: string;
  [ElementNames.statusBar]: string;
  [ElementNames.titleBar]: string;
}
