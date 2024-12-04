export const siteData = JSON.parse("{\"base\":\"/yatori-docs/\",\"lang\":\"en-US\",\"title\":\"Yatori\",\"description\":\"这是一个新一代在线课程管理系统\",\"head\":[[\"link\",{\"rel\":\"icon\",\"href\":\"/img/logo.png\"}]],\"locales\":{}}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateSiteData) {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ siteData }) => {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  })
}
