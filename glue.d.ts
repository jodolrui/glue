import { DefineComponent, ComponentOptionsWithObjectProps } from "vue";

export interface GlueInstance {
  composition: ComponentOptionsWithObjectProps | undefined;
  returned:
    | {
        [key: string]: any;
      }
    | undefined;
  constructor: (config: ComponentOptionsWithObjectProps) => void;
  include:
    | ((
        funct: (props: object, context: object) => object,
        props: object,
        context: object
      ) => void)
    | undefined;
  preinclude: ((funct: () => object) => void) | undefined;
  expose: (
    ...args:
      | [string, any]
      | [
          {
            [key: string]: any;
          }
        ]
  ) => any;
  exposed: () => any;
}
declare module "vue" {
  interface ComponentInternalInstance {
    glueInstance: GlueInstance;
  }
}
export declare function compose(name: string, parts: Object[]): DefineComponent;
export declare function expose(
  ...args:
    | [string, any]
    | [
        {
          [key: string]: any;
        }
      ]
): any;
export declare function exposed<T = any>(component?: string): T;
export declare function defineState<T>(defaultValue: T | {}): T;
