import { CssInjectionUnsupportedError, ICssPatcher } from './css-patcher';

export const cssPatcher: ICssPatcher = {
  async locate() {
    throw new CssInjectionUnsupportedError();
  },
  async validate() {
    return false;
  },
  async install() {
    throw new CssInjectionUnsupportedError();
  },
  async remove() {
    throw new CssInjectionUnsupportedError();
  },
};
