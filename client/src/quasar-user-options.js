import './styles/quasar.sass'
import iconSet from 'quasar/icon-set/fontawesome-v5.js'
import '@quasar/extras/fontawesome-v5/fontawesome-v5.css'
import { Notify, Dialog } from 'quasar';

// To be used on app.use(Quasar, { ... })
export default {
  config: {
    notify: {}
  },
  plugins: {
    Notify,
    Dialog
  },
  iconSet: iconSet
}

