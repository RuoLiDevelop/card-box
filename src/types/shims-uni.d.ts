/// <reference types='@dcloudio/types' />
/// <reference types="vue/dist/vue.d.ts" />

import 'vue'

declare module '@vue/runtime-core' {
  type Hooks = App.AppInstance & Page.PageInstance

  interface ComponentCustomOptions extends Hooks {}
}
