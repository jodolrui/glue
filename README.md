# Glue 

## Total feature separation

Glue is a [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) improvement that provides total feature separation in Vue components.

Total feature separation allows better code organization and less scrolling.

![Total feature separation with Glue](/images/feature-separation.png)

## Installation:

```
npm install “@jodolrui/glue”
```

## Example of use:

A typical [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) component with two features (`foo` and `bar`) looks like this:

```js
// Foobar.vue
<template>{{ foo }} {{ bar }}</template>
<script>
import { ref } from "vue";
export default {
  props: { foo: { type: String, default: "Foo" },
           bar: { type: String, default: "Bar" } },
  emits: ["foo", "bar"],
  setup(props, context) {
    let foo = ref(props.foo);
    context.emit("foo");
    let bar = ref(props.bar);
    context.emit("bar");
    return { foo, bar };
  },
};
</script>
```

Notice that features (`foo` and `bar`) appear mixed at some parts of the component:
* At `props` declaration.
* At `emits` declaration.
* Throughout `setup` function.
* At `return` statement.

With Glue you can **totally separate features into parts/files** as follows:

`foo.js` part:

```js
// foo.js
import { ref } from "vue";
export default {
  props: { foo: { type: String, default: "Foo" } },
  emits: ["foo"],
  setup(props, context) {
    let foo = ref(props.foo);
    context.emit("foo");
    return { foo };
  },
};
```

`bar.js` part:

```js
// bar.js
import { ref } from "vue";
export default {
  props: { bar: { type: String, default: "Bar" } },
  emits: ["bar"],
  setup(props, context) {
    let bar = ref(props.bar);
    context.emit("bar");
    return { bar };
  },
};
```

Note that each part/file uses regular [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) syntax.

Finally you have to assembly your component with `compose` function in the `<script>` section of the `*.vue` file this way:

```js
// Foobar.vue
<template>{{ foo }} {{ bar }}</template>
<script>
import { compose } from "glue";
import foo from "./foo.js";
import bar from "./bar.js";
export default compose("Foobar", [foo, bar]);
</script>
```

Function `compose` takes two parameters `(name, parts)`:

* The `name` of the component (i.e. `"Foobar"`).
* An array previously imported `parts` (i.e. `[foo, bar]`).

**Order of parts** in the array defines order of execution.

## Exposing variables and function to the template

A typical declaration in [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) of a variable exposed to the `<template>` looks like this:

```js
import { ref } from "vue";
export default {
  setup() {
    let foo = ref("bar");
    return { foo };
  },
};
```

Note that you have to:

* Declare the variable (`let foo`) and assign it a value (`= ref("bar")`)
* Return a literal object containing that variable (`return { foo }`)

Glue function `expose` allows you to achieve the same without having to `return`, as follows:

```js
import { ref } from "vue";
import { expose } from "glue";
export default {
  setup() {
    expose("foo", ref("bar"));
  },
};
```

In this case function `expose` takes two parameters `(key, object)`:

* The `key` name by which the element will be called in the `template` (i.e. `"foo"`).
* The `object` of the element itself (i.e. `ref("bar")`).

Function `expose` returns the element itself, so you can pass it to a variable when exposing if you need:

```js
const foo = expose("foo", ref("bar"));
```

Note that `const foo` defines the name of the variable and `expose("foo"` defines the name by which the element will be called in the `template`, so they can be different names.

Another syntax for function `expose` is as follows:

```js
const foo = ref("bar");
expose({ foo });
// ref("bar") is exposed to the template as 'foo'
```

In this case function `expose` takes only one parameter `(object)`:

* A literal `object` containing at root level elements to expose.

With this syntax you can expose multiple elements at once:

```js
const foo = ref("bar");
const bar = () => console.log(`value is ${foo.value}`);
expose({ foo, bar });
```

## Sharing variables and functions between parts (and components)

Elements exposed with `expose` function can be imported into another parts or components. You have to consider that only previously exposed elements can be imported; so, order of component mounting and order of parts in the array passed to function `compose` are determining.

An exposed element like this:

```js
const foo = ref("bar");
expose({ foo });
```

can be imported into another part of the same component using `exposed` function as follows:

```js
const { foo } = exposed(); 
```

Function `exposed` takes no parameters when importing from the same component.

To import from another component, `exposed` has to be used as follows:

```js
const { foo } = exposed("Foobar"); 
```

In this case function `exposed` takes only one parameter `(name)`:

* The `name` of the component to import from (i.e. `"Foobar"`).

It's important to know that both components have to be created with function `compose` in order to work.

## Limitations on using functions 'expose' and 'exposed'

Function `expose`, and function calling `exposed()` when referring to the same component, internally use [`getCurrentInstance`](https://v3.vuejs.org/api/composition-api.html#getcurrentinstance) Vue function. This function only works during setup or Lifecycle Hooks, so you have to take in account that `expose` and `exposed()` won't work out of those scopes.

If you need to use `expose` and `exposed()` outside of setup or Lifecycle Hooks, you can call `expose` and `exposed()` on setup and use the returned instance instead.
















