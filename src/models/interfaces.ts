import { ColorAdjustment } from './enums';

export interface IPreferredColors {
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
  foregroundHex: string;
  inactiveBackgroundHex: string;
  inactiveForegroundHex: string;
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
  preferredColors: IPreferredColors[];
}
