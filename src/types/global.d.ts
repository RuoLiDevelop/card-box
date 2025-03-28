declare const __UNI_PLATFORM__:
  | 'h5'
  | 'app'
  | 'mp-alipay'
  | 'mp-baidu'
  | 'mp-jd'
  | 'mp-kuaishou'
  | 'mp-lark'
  | 'mp-qq'
  | 'mp-toutiao'
  | 'mp-weixin'
  | 'quickapp-webview'
  | 'quickapp-webview-huawei'
  | 'quickapp-webview-union'

declare const __VITE_APP_PROXY__: 'true' | 'false'

export interface EditorContext {
  setContents: (options: { html: string }) => void
  getContents: (options: { success: (res: { text: string; html: string }) => void }) => void
  insertText: (options: { text: string; success?: () => void }) => void
}
