export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/get-started.html", { loader: () => import(/* webpackChunkName: "get-started.html" */"E:/Yatori-Dev/yatori-docs/docs/.vuepress/.temp/pages/get-started.html.js"), meta: {"title":"Get Started"} }],
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"E:/Yatori-Dev/yatori-docs/docs/.vuepress/.temp/pages/index.html.js"), meta: {"title":"Home"} }],
  ["/guide/Test.html", { loader: () => import(/* webpackChunkName: "guide_Test.html" */"E:/Yatori-Dev/yatori-docs/docs/.vuepress/.temp/pages/guide/Test.html.js"), meta: {"title":"测试页面"} }],
  ["/yatori-go-console/docs.html", { loader: () => import(/* webpackChunkName: "yatori-go-console_docs.html" */"E:/Yatori-Dev/yatori-docs/docs/.vuepress/.temp/pages/yatori-go-console/docs.html.js"), meta: {"title":"Yaotri-go-console"} }],
  ["/yatori-go-core/docs.html", { loader: () => import(/* webpackChunkName: "yatori-go-core_docs.html" */"E:/Yatori-Dev/yatori-docs/docs/.vuepress/.temp/pages/yatori-go-core/docs.html.js"), meta: {"title":"Yatori-go-core"} }],
  ["/404.html", { loader: () => import(/* webpackChunkName: "404.html" */"E:/Yatori-Dev/yatori-docs/docs/.vuepress/.temp/pages/404.html.js"), meta: {"title":""} }],
]);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateRoutes) {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
  }
  if (__VUE_HMR_RUNTIME__.updateRedirects) {
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ routes, redirects }) => {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  })
}
