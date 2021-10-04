# Glue (total feature separation in Vue 3 Composition API)

Glue provides total feature separation in [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) components.

Glue is intended for better code organization and less scrolling.

![Total feature separation with Glue](/images/feature-separation.png)

## Installation:

```
npm install “@jodolrui/glue”
```

## Example of use:

This is a typical [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) component with two features (`foo` and `bar`):

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

Notice that both features (`foo` and `bar`) appear mixed at some parts of the component:
* At `props` declaration.
* At `emits` declaration.
* Throughout `setup` function.
* At `return` statement.

With Glue you can totally separate features into parts/files:

`foo.js` part/file:

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

`bar.js` part/file:

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

Note that each part/file is written in normal [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) syntax. So you don't have to learn anything new to create them.

Finally, parts of components must to be assembled with function `compose`:

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

Function `compose` takes two parameters:

* The `name` of the component (i.e. `"Foobar"`).
* An array of `parts` (i.e. `[foo, bar]`).

Order of parts in array is very important because it defines order of execution.

## Exposing variables and function to the template

This is a typical declaration, in [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html), of a variable exposed (returned) to the `<template>`:

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

In this case, function `expose` takes two parameters:

* The `key` or name by which the element will be referred in the `template` (i.e. `"foo"`).
* The `object` of the element itself (i.e. `ref("bar")`).

Function `expose` returns the passed element itself, so you can assign it to a variable when exposing:

```js
const foo = expose("foo", ref("bar"));
```

Another syntax for `expose` is as follows:

```js
const foo = ref("bar");
expose({ foo });
```

In this case function `expose` takes only one parameter:

* A literal `object` containing elements to expose.

With this syntax you can expose multiple elements at once:

```js
const foo = ref("bar");
const bar = () => console.log(`value is ${foo.value}`);
expose({ foo, bar });
```

Notice that function `expose` can be called throughout function `setup`, so that you can `expose` elements at the very time they are defined or immediately thereafter. This strengthens feature separation as yout don't need to put all them in a `return` statement at the end of `setup` function.


## Sharing variables and functions between parts or components

Elements exposed with Glue can be imported into another parts or components.

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

can be imported into another part of the same component calling function `exposed()`:

```js
const { foo } = exposed(); 
```

or like this:

```js
exposed().foo; 
```

To import from another component `exposed` has to take one parameter:

```js
const { foo } = exposed("Foobar"); 
```

That parameter is:

* The `name` of the component to import from (i.e. `"Foobar"`).

It's important to know that both components must to be created with function `compose` in order this to work.

Notice that only previously exposed elements can be imported, so that order of component mounting and, order of parts in the array passed to function `compose`, are determining.

If you try to retrieve an inexistent exposed element (or a misspelled one), Glue will throw an error:

> [Glue error] Unknown key 'foo' in 'exposed' function.

## Limitations on the use of functions 'expose' and 'exposed'

Function `expose` and, `exposed` referring to the same component (aka `exposed()`), only work during setup or lifecycle hooks, as they internally make use of the Vue function [`getCurrentInstance`](https://v3.vuejs.org/api/composition-api.html#getcurrentinstance) wich has such limitation. So Glue will throw an error if they are used in invalid scopes:

> [Glue error] Cannot use 'expose' in this scope.

> [Glue error] Cannot use 'exposed' in this scope.

If you need to use `expose` and `exposed()` outside setup or lifecycle hooks, you can call `expose` and `exposed()` on setup and use the returned instance instead.
















