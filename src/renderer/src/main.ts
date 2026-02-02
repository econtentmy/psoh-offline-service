import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import fonts
import '@fontsource/rubik/300.css'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/500.css'
import '@fontsource/rubik/700.css'
import '@fontsource/rubik/900.css'

// Import styles
import './assets/css/style.css'
import './assets/css/custom.css'
import './assets/css/touchscreen.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
