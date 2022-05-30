# Glue (total feature separation in Vue 3 Composition API)

Glue provides total feature separation in [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) components.

Glue is intended for better code organization and less scrolling.

![Total feature separation with Glue](/images/feature-separation.png)

## Installation

```
npm install @jodolrui/glue
```

## Version
* __1.0.5__ `defineState` function.

* __1.0.4__ Typescript support in `exposed()` function.

* __1.0.3__ Add license.

* __1.0.1__ First version.

## Example of use

### The issue

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

### Glue solution

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

Note that each part/file is written in normal [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) syntax, so you don't have to learn anything new to create them.

Finally, parts must to be assembled with function `compose` in `Foobar.vue` component file:

```html
<!-- Foobar.vue -->
<template>{{ foo }} {{ bar }}</template>
<script>
import { compose } from "@jodolrui/glue";
import foo from "./foo";
import bar from "./bar";
export default compose("Foobar", [foo, bar]);
</script>
```

Function `compose` takes two parameters:

* The `name` of the component (i.e. `"Foobar"`).
* An array of `parts` (i.e. `[foo, bar]`).

__Warning:__ Order of parts in array is very important because it defines order of execution.

You have to import `Foobar.vue` file from your parent component as usual in order to use it:

```js
import Foobar from './Foobar.vue'
// ...
<Foobar />
```

## Exposing variables and functions to the template

### The issue

This is a typical declaration of a variable exposed to the `<template>` in a [Vue 3 Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) component:

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

### Glue solution

Glue function `expose` allows you to achieve the same without having to `return`:

```js
import { ref } from "vue";
import { expose } from "@jodolrui/glue";
export default {
  setup() {
    expose("foo", ref("bar"));
  },
};
```

In this case, function `expose` takes two parameters:

* The `key` or name by which the element will be referred in the `<template>` (i.e. `"foo"`).
* The `object` of the element itself (i.e. `ref("bar")`).

Function `expose` returns the passed element itself, so you can assign it to a variable:

```js
import { expose } from "@jodolrui/glue";
// ...
const foo = expose("foo", ref("bar"));
```

### Alternative syntax

Another syntax for `expose` is:

```js
import { expose } from "@jodolrui/glue";
// ...
const foo = ref("bar");
expose({ foo });
```

In this case function `expose` takes only one parameter: a literal `object` containing elements to expose.

The advantage of this syntax is that you can expose multiple elements in one line:

```js
import { expose } from "@jodolrui/glue";
// ...
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
import { exposed } from "@jodolrui/glue";
// ...
const { foo } = exposed(); 
```

or this way:

```js
import { exposed } from "@jodolrui/glue";
// ...
exposed().foo; 
```

You can also import with `typescript` support this way:

```ts
import { exposed } from "@jodolrui/glue";
// ...
type Type = {
  foo: Ref<string>;
}
// ...
const { foo } = exposed<Type>(); 
```

To import from another component `exposed` has to take one parameter:

```js
import { exposed } from "@jodolrui/glue";
// ...
const { foo } = exposed("Foobar"); 
```

The parameter is the `name` of the component to import from (i.e. `"Foobar"`).

It's important to know that both components must to be created with function `compose` in order this to work.

Notice that only previously exposed elements can be imported, so that order of component mounting and order of parts in the array passed to function `compose` are determining.

If you try to retrieve an nonexistent exposed element (or a misspelled one), Glue will throw an error:

> [Glue error] Unknown key 'foo' in 'exposed' function.

## Limitations on the use of functions 'expose' and 'exposed'

Function `expose` and function `exposed` referring to the same component (aka `exposed()`) only work during setup or lifecycle hooks, as they internally make use of the Vue function [`getCurrentInstance`](https://v3.vuejs.org/api/composition-api.html#getcurrentinstance), wich has such limitation. So Glue will throw an error if they are used in invalid scopes:

> [Glue error] Cannot use 'expose' in this scope.

> [Glue error] Cannot use 'exposed' in this scope.

If you need to use `expose` or `exposed()` outside setup or lifecycle hooks, you can call them on setup and use the instance instead.

## Typescript errors in *.vue file

If using Glue with typescript it is possible that your IDE show errors in the `*.vue` file indicating that variables you exposed to the `<template>` are unknown. This issue doesn't break the application, which should work correctly, but they can be annoying. To avoid this problem I suggest disabling typescript in the `*.vue`.

Remove `*.vue` extension from `tsconfig.json`:

```js
// "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx"]
```

Remove reference to typescript language from `*.vue` file:

```js
// <script lang="ts">
<script>
```

## Separation of html and css

If you want to separate `html` and `css` out of the `*.vue` file, you can do something like this:

```html
<!-- index.vue -->
<script src="./script.js"></script>
<style scoped src="./style.css"></style>
<template src="./template.html"></template>
```

```js
// script.js
import { compose } from "@jodolrui/glue";
import foo from "./parts/foo";
export default compose("Foo", [foo]);
```

```js
// parts/foo.js
import { ref } from "vue";
import { expose } from "@jodolrui/glue";
export default {
  props: { foo: { type: String, default: "Foo" } },
  emits: ["foo"],
  setup(props, context) {
    expose("foo", ref(props.foo));
    context.emit("foo");
  },
};
```

```html
<!-- template.html -->
<p>{{ foo }}</p>
```

```css
/* type.css */
* {
  color: black;
}
```

## Using with `<script setup>`

You can use `glue` with [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html) syntactic sugar.

You only have to put your parts into `*.vue` files within a `<script setup>` tag and then assemble them with `compose` function as usual.

Here you have an example:

`foo.vue` part/file:

```html
<!-- foo.vue -->
<script setup>
import { ref } from "vue";
let foo = ref("Foo");
</script>
```

`bar.vue` part/file:

```html
<!-- bar.vue -->
<script setup>
import { ref } from "vue";
import { exposed } from "@jodolrui/glue";
let bar = ref("Bar");
let { foo } = exposed();
let foobar = ref(foo.value + bar.value);
</script>
```

Assemble with function `compose` in `Foobar.vue` component file:

```html
<!-- Foobar.vue -->
<template>{{foo}} + {{bar}} = {{ foobar }}</template> <!-- prints "Foo + Bar = FooBar" -->
<script>
import { compose } from "@jodolrui/glue";
import foo from "./foo.vue"; // don't forget .vue extension
import bar from "./bar.vue"; // don't forget .vue extension
export default compose("Foobar", [foo, bar]);
</script>
```

Note that using `<script setup>` you don't need to use `expose` function.

## Centralizing component state with 'defineState'

Function `defineState` allows you to centralize component state declaration and preseting in one place and use it with `typescript` types in all your component parts.

You have to declare and preset your state variables creating a `useState` function this way:

```js
// state.ts
import { defineState } from "glue";
import { Ref, ref } from "vue";

export function useState() {
  return defineState<{
    foo: Ref<string>;
    bar: Ref<string>;
  }>({
    foo: ref("Foo"),
    bar: ref("Bar")
  });
}
```

Then you can access your state calling `useState` function from any component part:

```js
// foo.js
import { ref } from "vue";
import { useState } from "../state";
export default {
  props: { foo: { type: String, default: "Foo" } },
  emits: ["foo"],
  setup(props, context) {
    const state = useState(); // state is typed
    state.foo.value = props.foo;
    context.emit("foo");
  },
};
```

You don't need to `return`, `expose` nor `exposed` when using state centralization with `defineState` and `useState`.







