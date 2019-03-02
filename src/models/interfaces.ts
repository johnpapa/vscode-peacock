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

export interface IPeacockAffectedElementSettings {
  activityBar: boolean;
  statusBar: boolean;
  titleBar: boolean;
}
export interface IPeacockSettings {
  affectedElements: IPeacockAffectedElementSettings;
  preferredColors: IPreferredColors[];
}
