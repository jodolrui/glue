import { getCurrentInstance } from "vue";

//* --> helpers
function put(container, content, key) {
  container[key] = content;
  return container;
}
function spread(container, content) {
  container = Object.assign(Object.assign({}, container), content);
  return container;
}
function extractArgs(args) {
  let key = undefined;
  let obj;
  if (args.length === 1) {
    obj = args[0];
  } else if (args.length === 2) {
    key = args[0];
    obj = args[1];
  }
  return { key, obj };
}
function keySwitch(args, withoutKey, withKey) {
  let { key, obj } = extractArgs(args);
  if (key) {
    return withKey(key, obj);
  } else {
    return withoutKey(obj);
  }
}
//* returns object if it exists in collection; shows an error if not
function getByKey(key, collection, callerName) {
  if (key in collection) {
    return collection[key];
  } else {
    throw new Error(
      `[Glue error] Unknown key '${key}' in '${callerName}' function.`,
    );
  }
}
function getThisInstance(callerName) {
  let result;
  try {
    //! getCurrentInstance() can only be called from setup and hooks
    result = getCurrentInstance().glueInstance;
  } catch (err) {
    if (err)
      throw new Error(
        `[Glue error] Cannot use '${callerName}' in this scope.`,
      );
  }
  return result;
}
function getInstance(key, callerName) {
  let instance;
  if (key) instance = getByKey(key, instances, callerName);
  else instance = getThisInstance(callerName);
  return instance;
}
//* --< helpers

//* --> "createInstance" function
function createInstance(config) {
  const instance = {
    composition: undefined,
    returned: undefined,
    constructor: function (config) {
      //* this.composition is a Vue 3 Composition API object
      //* we can pass its properties and methods in "config" parameter
      this.composition = {
        name: config ? (config.name ? config.name : "") : "",
        props: config ? (config.props ? config.props : {}) : {},
        components: config ? (config.components ? config.components : {}) : {},
        emits: config ? (config.emits ? config.emits : []) : [],
        setup: config ? (config.setup ? config.setup : () => {}) : () => {},
      };
      this.returned = {};
    },
    include: undefined,
    preinclude: undefined,
    expose: function (...args) {
      return keySwitch(
        args,
        (obj) => {
          this.returned = spread(this.returned, obj);
          return obj;
        },
        (key, obj) => {
          this.returned = put(this.returned, obj, key);
          return obj;
        },
      );
    },
    exposed: function () {
      return this.returned;
    },
  };
  //* creates the instance object
  instance.constructor(config);
  //* includes a function passing props and context to it
  instance.include = function (funct, props, context) {
    const returned = funct(props, context);
    instance.returned = spread(instance.returned, returned);
  };
  //* includes a function not passing props and context
  //* specially conceived for pre-setup configuration
  instance.preinclude = function (funct) {
    funct();
  };
  //* we return a instance object
  return instance;
}
//* --< "createInstance" function

let instances = {};

//* --> "compose" function
export function compose(name, parts) {
  const config = {
    name: name,
    parts: parts,
  };
  const instance = createInstance(config);
  if (config.parts) {
    //* we set name, props, components and emits (if passed)
    config.parts.forEach((item) => {
      if (item.name) instance.composition.name = item.name;
      //* if props is array
      if (
        typeof item.props === "object" &&
        item.props !== null &&
        item.props.constructor === Array
      ) {
        //* converts to literal object
        let list = {};
        item.props.forEach((element) => {
          put(list, String, element);
        });
        item.props = list;
      }
      instance.composition.props = spread(
        instance.composition.props,
        item.props,
      );
      instance.composition.components = spread(
        instance.composition.components,
        item.components,
      );
      instance.composition.emits = instance.composition.emits.concat(
        item.emits,
      );
    });
    //* we set the Vue Composition API object setup method
    instance.composition.setup = (props, context) => {
      //* with this, we attach the instance to the component "glueInstance" property
      //* this is necessary to access the instance using getCurrentInstance() in this module
      (() => {
        getCurrentInstance().glueInstance = instance;
      })();
      //* we include setup methods (if passed)
      config.parts.forEach((item) => {
        instance.include(item.setup, props, context);
      });
      //* this is the return of the global setup method
      return Object.assign({}, instance.returned);
    };
  }
  //* we store the new instance in the instances collection
  instances = put(instances, instance, config.name);
  //* we return the Vue Composition API object
  return instance.composition;
}
//* --< "compose" function

//* "expose" function
export function expose(...args) {
  const instance = getInstance(null, "expose");
  return keySwitch(
    args,
    (obj) => {
      instance.returned = spread(instance.returned, obj);
      return obj;
    },
    (key, obj) => {
      instance.returned = put(instance.returned, obj, key);
      return obj;
    },
  );
}

//* "exposed" function
//! order of components and order of parts passed to "compose" function are important
//! only exposed variables declared in previous components and parts are retrieved by "exposed" function
export function exposed(component) {
  const instance = getInstance(component, "exposed");
  return instance.exposed();
}

//* "defineState" function
export function defineState(defaultValue) {
  const gi = getCurrentInstance()?.glueInstance;
  const isEmpty =
    Object.keys(gi?.exposed()).length === 0 &&
    Object.getPrototypeOf(gi?.exposed()) === Object.prototype;
  if (isEmpty) gi?.expose(defaultValue);
  return getCurrentInstance()?.glueInstance.exposed();
}
