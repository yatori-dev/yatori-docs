import comp from "E:/Yatori-Dev/yatori-docs/docs/.vuepress/.temp/pages/yatori-go-core/docs.html.vue"
const data = JSON.parse("{\"path\":\"/yatori-go-core/docs.html\",\"title\":\"Yatori-go-core\",\"lang\":\"en-US\",\"frontmatter\":{},\"headers\":[],\"git\":{\"updatedTime\":1733233657000,\"contributors\":[{\"name\":\"Changbaiqi\",\"email\":\"changbaiqi@foxmail.com\",\"commits\":1}]},\"filePathRelative\":\"yatori-go-core/docs.md\"}")
export { comp, data }

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
