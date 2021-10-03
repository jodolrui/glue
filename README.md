# Glue 

Installation:

```
npm install “@jodolrui/glue”
```

Example of use:

```js
// parts/value.js
import { ref } from "vue";
import { expose } from "@jodolrui/glue";

export default {
  setup() {
    let counter = ref(0);
    expose({ counter }); // returns counter variable
  },
};
```

```js
// parts/down.js
import { expose, exposed } from "@jodolrui/glue";

export default {
  setup() {
    let { counter } = exposed(); // injects counter variable
    function goDown() {
      counter.value--; // substracts
    }
    expose({ goDown }); // returns goDown function
  },
};

```

```js
// parts/up.js
import { expose, exposed } from "@jodolrui/glue";

export default {
  setup() {
    let { counter } = exposed(); // injects counter variable
    function goUp() {
      counter.value++; // adds
    }
    expose({ goUp }); // returns goUp function
  },
};

```

```js
// template.vue
<style scoped src="./styles.css"></style>

<script>
import { compose } from "@jodolrui/composer";
import value from "./parts/value";
import up from "./parts/up";
import down from "./parts/down";
export default compose("Counter", [value, up, down]); // component is composed from the parts
</script>

<template>
  <div>
    <h1>{{ counter }}</h1>
    <button @click="goUp">Up</button>
    <button @click="goDown">Down</button>
  </div>
</template>
```