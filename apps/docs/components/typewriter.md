# Typewriter

> 成熟度：Beta

支持打字、删除、循环、暂停时长、光标定制、事件监听和命令式控制。

```vue
<script setup lang="ts">
import { MfTypewriter } from 'mind-forge/typewriter'
</script>

<template>
  <MfTypewriter text="MindForge" mode="loop" :speed="80" />
</template>
```
