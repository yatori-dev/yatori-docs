import comp from "E:/Yatori-Dev/yatori-docs/docs/.vuepress/.temp/pages/guide/Test.html.vue"
const data = JSON.parse("{\"path\":\"/guide/Test.html\",\"title\":\"测试页面\",\"lang\":\"en-US\",\"frontmatter\":{\"title\":\"测试页面\"},\"headers\":[],\"git\":{\"updatedTime\":1733233657000,\"contributors\":[{\"name\":\"Changbaiqi\",\"email\":\"changbaiqi@foxmail.com\",\"commits\":1}]},\"filePathRelative\":\"guide/Test.md\"}")
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
