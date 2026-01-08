import { Plugin } from "prettier";

export interface PluginOptions {
  absolutePathPrefix?: string;
  maxRelativePathDepth?: number;
  tsconfigPath?: string;
  nextjsMode?: boolean;
}

declare const plugin: Plugin<PluginOptions>;
export default plugin;

