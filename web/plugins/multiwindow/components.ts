// Diem vao componentLoader.ts:13 tim: getPluginSubpathEntry(name, "./components").
// Loader KHONG doc index.ts.
//
// Export CONSTRUCTOR chu khong phai component: registry goi
// componentRegistry.register(name, ctor) roi buildLayoutForEntries goi ctor()
// de lay component. Export thang component thi ctor() tra ve null.
export { default as MultiWindow } from "./index.ts"
