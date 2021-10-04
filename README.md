# Glue (total feature separation in Vue 3 Composition API components)

Glue is a [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) improvement that provides total feature separation for better code organization and less scrolling.

![Total feature separation with Glue](/images/feature-separation.png)

## Installation:

```
npm install “@jodolrui/glue”
```

## Example of use:

A typical [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) [Single File Component](https://v3.vuejs.org/api/sfc-spec.html#sfc-syntax-specification) with two features (`foo` and `bar`) looks like this:

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

With Glue you can totally separate features into parts/files:

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

Note that each part/file is written using normal [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) syntax.

Finally the parts of the component must to be assemblied using function `compose`:

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

Function `compose(name, parts)` takes two parameters:

* The `name` of the component (i.e. `"Foobar"`).
* An array of `parts` (i.e. `[foo, bar]`).

Order of parts in array is very important because defines order of execution.

## Exposing variables and function to the template

A typical declaration in [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) of a variable exposed (returned) to the `<template>` looks like this:

```js
import { ref } from "vue";
export default {
  setup() {
    let foo = ref("bar");
    return { foo };
  },
};
```

Notice that you have to:

* Declare the variable (`let foo`) and assign it a value (`= ref("bar")`)
* `return` a literal object containing the variable (`return { foo }`)

Glue function `expose` allows you to achieve the same without having to `return`:

```js
import { ref } from "vue";
import { expose } from "glue";
export default {
  setup() {
    expose("foo", ref("bar"));
  },
};
```

In this case, function `expose(key, object)` takes two parameters:

* The `key` or name by which the element will be called in the `template` (i.e. `"foo"`).
* The `object` of the element itself (i.e. `ref("bar")`).

Function `expose` returns the element itself. You can pass it to a variable when exposing if you need:

```js
const foo = expose("foo", ref("bar"));
```

Notice that `const foo` defines the name of the variable and `expose("foo"` defines the name by which the element will be called in the `template`, so they can be different names.

Another syntax for function `expose` is as follows:

```js
const foo = ref("bar");
expose({ foo });
```

In this case function `expose(object)` takes only one parameter`:

* A literal `object` containing, at root level, elements to expose.

With this syntax you can expose multiple elements at once, similar as you would do with `return`:

```js
const foo = ref("bar");
const bar = () => console.log(`value is ${foo.value}`);
expose({ foo, bar });
```

Notice that function `espose` doesn't need to be called at the end of `setup` method, as `return` does. You can `expose` elements at the very time they are defined or immediately thereafter. This strengthens feature separation.


## Sharing variables and functions between parts (and components)

Elements exposed with Glue can be imported into another parts or components. Only previously exposed elements can be imported, therefore order of component mounting and, order of parts in the array passed to function `compose`, are determining.

An exposed element like this:

```js
const foo = ref("bar");
expose({ foo });
```

or like this:

```js
const foo = ref("bar");
return { foo };
```

can be imported into another part of the same component using function `exposed`:

```js
const { foo } = exposed(); 
```

Notice that function `exposed` takes no parameters when importing from the same component.

To import from another component, `exposed` has to take one parameter:

```js
const { foo } = exposed("Foobar"); 
```

This parameter in `exposed(name)` is:

* The `name` of the component to import from (i.e. `"Foobar"`).

It's important to know that both components must to be created with function `compose` in order to work.

## Limitations on the use of functions 'expose' and 'exposed'

Function `expose` and function `exposed` when referring to the same component (aka `exposed()`) internally use function [`getCurrentInstance`](https://v3.vuejs.org/api/composition-api.html#getcurrentinstance) from Vue. This function only works during setup or lifecycle hooks, so you have to take into account that `expose` and `exposed()` won't work out of those scopes.

If you need to use `expose` and `exposed()` outside setup or lifecycle hooks, you can call `expose` and `exposed()` on setup and use the returned instance instead.
















