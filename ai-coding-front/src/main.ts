import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import {
  Alert,
  Avatar,
  Button,
  Card,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Pagination,
  Result,
  Segmented,
  Select,
  Skeleton,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '../tokens.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

for (const component of [
  Alert,
  Avatar,
  Button,
  Card,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Pagination,
  Result,
  Segmented,
  Select,
  Skeleton,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
]) {
  app.use(component)
}

app.mount('#app')
