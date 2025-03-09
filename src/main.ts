import { createSSRApp } from 'vue'

import App from './App.vue'
import { routeInterceptor, requestInterceptor, prototypeInterceptor } from './interceptors'
import store from './store'
import 'virtual:uno.css'
import '@/style/index.scss'

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.use(routeInterceptor)
  app.use(requestInterceptor)
  app.use(prototypeInterceptor)
  return {
    app,
  }
}
