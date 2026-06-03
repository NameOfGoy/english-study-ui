<template>
  <div class="admin-chat-page">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="AI 辅助"
      left-arrow
      @click-left="$router.back()"
    >
      <template #right>
        <span class="conn-badge" :class="connStatusClass">
          <span class="dot"></span>
          {{ connStatusText }}
        </span>
      </template>
    </van-nav-bar>

    <!-- 消息列表 -->
    <div class="chat-scroll" ref="scrollRef" @scroll.passive="onScroll">
      <div v-if="!authed" class="empty-tip">
        <p>需要 AI 辅助密钥才能使用</p>
        <p class="empty-sub">填写后才会建立连接</p>
        <van-button v-if="!keyDialogShow" size="small" type="primary" @click="reopenKeyDialog" style="margin-top:12px;">
          重新输入密钥
        </van-button>
      </div>
      <div v-else-if="connStatus !== 'ready'" class="empty-tip">
        <p>已登录, 但 WS 还没连上</p>
        <p class="empty-sub">{{ connDetailText }}</p>
        <van-button v-if="connStatus === 'disconnected'" size="small" type="primary" @click="manualReconnect" style="margin-top:12px;">
          手动重连
        </van-button>
      </div>
      <div v-else-if="!aiConnected" class="empty-tip">
        <p>WS 已连接, 但 AI 端还没上线</p>
        <p class="empty-sub">等老公在电脑上启动 /启动ai辅助功能 skill 后, 这里会自动变绿</p>
      </div>
      <div v-else-if="messages.length === 0" class="empty-tip">
        <p>跟 AI 说一下你想改什么</p>
        <p class="empty-sub">"在词典页加个搜索框"，AI 会改代码并自动部署</p>
      </div>
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="msg-card"
        :class="['role-' + msg.role, msg.role === 'ai' ? 'status-' + msg.status : '', msg.flash ? 'flash' : '']"
      >
        <div class="msg-meta">
          <span class="role-label">{{ msg.role === 'user' ? '你' : 'AI' }}</span>
          <span v-if="msg.role === 'ai'" class="status-badge">{{ statusLabel(msg.status) }}</span>
          <span class="ts">{{ formatTime(msg.timestamp) }}</span>
        </div>
        <div
          v-if="msg.role === 'ai' && msg.status === 'done' && msg.content"
          class="msg-content md"
          v-html="renderMarkdown(msg.content)"
        ></div>
        <div v-else class="msg-content">{{ msg.content || '...' }}</div>
        <div v-if="msg.file" class="msg-file">📎 {{ msg.file.name }}</div>
        <div v-if="msg.role === 'ai' && msg.progressNote" class="msg-progress">{{ msg.progressNote }}</div>
        <div
          v-if="msg.role === 'ai' && (msg.status === 'failed' || (msg.status === 'done' && msg.content))"
          class="msg-actions"
        >
          <span v-if="msg.status === 'failed'" class="act" @click="retryMessage(msg)">↻ 重试</span>
          <span v-if="msg.status === 'failed'" class="act" @click="editResend(msg)">✎ 编辑后重发</span>
          <span v-if="msg.status === 'done'" class="act" @click="copyMessage(msg)">⎘ 复制</span>
        </div>
      </div>
    </div>

    <!-- 上滑看历史时, 新消息到达的回到底部提示 -->
    <div v-if="hasNewBelow" class="new-msg-chip" @click="jumpToBottom">↓ 新消息</div>

    <!-- 待发附件预览 -->
    <div v-if="pendingFile" class="pending-file">
      <span class="pf-name">📎 {{ pendingFile.name }}</span>
      <span class="pf-size">{{ (pendingFile.size / 1024).toFixed(0) }} KB</span>
      <van-icon name="cross" class="pf-remove" @click="removePendingFile" />
    </div>

    <!-- 输入区 -->
    <div class="chat-input-bar">
      <van-icon
        name="add-o"
        class="attach-btn"
        :class="{ disabled: !canSend || uploading }"
        @click="(!canSend || uploading) ? null : onPickFile()"
      />
      <van-field
        v-model="draft"
        rows="2"
        autosize
        type="textarea"
        placeholder="告诉 AI 你想做什么 (可附文件)..."
        @keydown="onKeydown"
      />
      <van-button
        v-if="inFlight && !uploading"
        type="warning"
        @click="onCancel"
      >
        停止
      </van-button>
      <van-button
        v-else
        type="primary"
        :loading="uploading"
        :disabled="!canSend || uploading || (!draft.trim() && !pendingFile)"
        @click="onSend"
      >
        {{ uploading ? '上传中' : sendBtnLabel }}
      </van-button>
    </div>

    <!-- AccessKey 输入对话框 -->
    <van-dialog
      v-model:show="keyDialogShow"
      title="AI 辅助密钥"
      :show-cancel-button="true"
      :before-close="onKeyDialogConfirm"
      cancel-button-text="返回"
      confirm-button-text="登录"
      :closeOnClickOverlay="false"
    >
      <div class="key-dialog-body">
        <p class="hint">{{ keyDialogHint }}</p>
        <van-field
          v-model="accessKeyInput"
          type="password"
          placeholder="输入 AI 辅助密钥"
          clearable
        />
        <p v-if="keyDialogError" class="error-msg">{{ keyDialogError }}</p>
      </div>
    </van-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { isAdmin } from '@/utils/auth'
import { relayLogin, relayRefresh, uploadChatFile } from '@/api/cc'
import { selectFiles } from '@/api/file'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

// AI 回复渲染 markdown (代码块/列表/链接); html:false 关内联 HTML, 再过 DOMPurify 双保险防 XSS.
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

// 连接状态机
const CONN_DISCONNECTED = 'disconnected'
const CONN_CONNECTING = 'connecting'
const CONN_READY = 'ready'
const CONN_SENDING = 'sending'

// AI 消息状态 (UI 显示用)
const AI_TYPING = 'typing'
const AI_PROGRESS = 'progress'
const AI_DONE = 'done'
const AI_FAILED = 'failed'
const AI_CANCELLED = 'cancelled' // 取消终态 (为"停止"功能预留)

const SESSION_KEY = 'cc_chat_session_id'
const REFRESH_TOKEN_KEY = 'cc_refresh_token'
const REFRESH_EXP_KEY = 'cc_refresh_expires_at'

// 历史持久化 (localStorage, 不是 sessionStorage): 离开页面/刷新/新标签都不丢.
// 按 sessionId 分桶, 封顶防 localStorage 配额炸掉整个 app.
const MSG_KEY_PREFIX = 'cc_chat_msg:'
const MAX_MSGS = 200          // 只留最近 N 条
const MAX_CONTENT_LEN = 4096  // 单条 content 持久化截断 (超长 AI 回复)
// 附件白名单 (前端 accept; 真正校验在后端 MIME 嗅探)
const FILE_ACCEPT = '.xlsx,.csv,.txt,.pdf,image/*'
const MAX_FILE_BYTES = 20 * 1024 * 1024 // 跟后端 20MB 一致, 前端先挡一道

function genId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getOrInitSessionId() {
  try {
    let s = localStorage.getItem(SESSION_KEY)
    if (s) return s
    // 迁移/认领: 老版本把 sessionId 放 sessionStorage(新标签/重载即丢历史). 改存 localStorage;
    // 若已存在唯一的历史消息桶, 复用它的 id 让历史接着用, 不凭空开新空会话.
    const buckets = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.indexOf(MSG_KEY_PREFIX) === 0) buckets.push(k.slice(MSG_KEY_PREFIX.length))
    }
    let oldS = null
    try { oldS = sessionStorage.getItem(SESSION_KEY) } catch (_) {}
    if (oldS && buckets.indexOf(oldS) !== -1) s = oldS
    else if (buckets.length === 1) s = buckets[0]
    else s = genId()
    localStorage.setItem(SESSION_KEY, s)
    return s
  } catch (_) {
    return genId()
  }
}

// 清掉非当前会话的孤儿消息桶, 防一堆 cc_chat_msg:* 撑爆 localStorage 配额.
function gcOrphanMsgBuckets(keepId) {
  try {
    const toRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.indexOf(MSG_KEY_PREFIX) === 0 && k.slice(MSG_KEY_PREFIX.length) !== keepId) {
        toRemove.push(k)
      }
    }
    for (const k of toRemove) localStorage.removeItem(k)
  } catch (_) {}
}

export default {
  name: 'AdminChat',
  setup() {
    const router = useRouter()
    const draft = ref('')
    const messages = ref([])
    const connStatus = ref(CONN_DISCONNECTED)
    const scrollRef = ref(null)
    // 滚动跟随: 只在贴底时自动滚到底; 用户上滑看历史时不打断, 改用"↓ 新消息"提示.
    const isPinned = ref(true)
    const hasNewBelow = ref(false)
    const sessionId = ref(getOrInitSessionId())

    // 附件: 选中待发文件 (上传在发送时做)
    const pendingFile = ref(null) // File 对象
    const uploading = ref(false)

    const msgKey = () => MSG_KEY_PREFIX + sessionId.value

    // hydrate: 从 localStorage 恢复历史 (进页面立即可见, 不依赖连接)
    function hydrateMessages() {
      try {
        const raw = localStorage.getItem(msgKey())
        if (!raw) return
        const arr = JSON.parse(raw)
        if (!Array.isArray(arr)) return
        // 上次在处理中(typing/progress)就刷新/离开了 → 结果可能已丢, 别让气泡永远"思考中"
        for (const m of arr) {
          if (m.role === 'ai' && (m.status === AI_TYPING || m.status === AI_PROGRESS)) {
            m.status = AI_FAILED
            m.content = m.content || '（上次处理结果没收到，可以重新发一次）'
            m.progressNote = ''
          }
          m.flash = false
        }
        messages.value = arr
      } catch (e) {
        console.warn('[chat] hydrate failed', e)
      }
    }

    // persist: 防抖写回 localStorage; 封顶条数 + 单条截断 + QuotaExceeded 降级
    let persistTimer = null
    function persistMessages() {
      if (persistTimer) clearTimeout(persistTimer)
      persistTimer = setTimeout(() => {
        try {
          let arr = messages.value.slice(-MAX_MSGS).map(m => {
            const c = typeof m.content === 'string' && m.content.length > MAX_CONTENT_LEN
              ? m.content.slice(0, MAX_CONTENT_LEN) + '…(截断)'
              : m.content
            return { ...m, content: c, flash: false }
          })
          try {
            localStorage.setItem(msgKey(), JSON.stringify(arr))
          } catch (e1) {
            // 多半是 QuotaExceededError: 丢最老一半再试一次
            arr = arr.slice(Math.floor(arr.length / 2))
            try { localStorage.setItem(msgKey(), JSON.stringify(arr)) } catch (e2) { /* 静默降级 */ }
          }
        } catch (e) {
          console.warn('[chat] persist failed', e)
        }
      }, 300)
    }

    // 二次门禁状态
    const authed = ref(false)
    // AI 端 (本地代理 gRPC) 是否连上转发器, 由转发器推 PEER_STATUS envelope 同步
    const aiConnected = ref(false)
    const keyDialogShow = ref(false)
    const accessKeyInput = ref('')
    const keyDialogError = ref('')
    const keyDialogHint = ref('') // "首次登录" / "登录过期, 重新输入"

    // token & refresh 调度
    let accessToken = null
    let accessExpiresAt = 0   // unix sec
    let wsURL = ''
    let refreshTimer = null   // setTimeout id, access 过期前 60s 触发

    // ws 实例 + 重连相关
    let ws = null
    let reconnectTimer = null
    let reconnectDelay = 1000
    const RECONNECT_MAX = 30000

    onMounted(async () => {
      if (!isAdmin()) {
        showToast({ message: '此功能仅管理员可用', type: 'fail' })
        router.replace('/profile')
        return
      }
      // 先恢复历史 (立即可见, 不等连接) —— 这才是"回来还能看到对话"的根治
      hydrateMessages()
      gcOrphanMsgBuckets(sessionId.value)
      await scrollBottom(true)
      // 尝试 silent refresh (localStorage refresh 有效则不弹密钥框)
      const ok = await trySilentRefresh()
      if (!ok) {
        promptKey('请输入 AI 辅助密钥')
      }
    })

    // messages 变了就防抖写回 localStorage (含异步 REPLY 在离开期间到达的情况)
    watch(messages, persistMessages, { deep: true })

    // 选附件 (上传推迟到发送时)
    async function onPickFile() {
      try {
        const files = await selectFiles(FILE_ACCEPT, false)
        const f = files[0]
        if (!f) return
        if (f.size > MAX_FILE_BYTES) {
          showToast({ message: '文件不能超过 20MB', type: 'fail' })
          return
        }
        pendingFile.value = f
      } catch (_) {
        // 用户取消选择, 忽略
      }
    }

    function removePendingFile() {
      pendingFile.value = null
    }

    onBeforeUnmount(() => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (refreshTimer) clearTimeout(refreshTimer)
      if (ws) {
        try { ws.close(1000, 'page leave') } catch (_) {}
        ws = null
      }
    })

    // 是否有一轮 AI 正在处理 (含附件上传窗口). 锁住发送, 防"AI 没回就又发一条"
    // 对同一个串行 Claude Code 并发改代码 + 部署 (这是安全 bug, 不只是 UX).
    const inFlight = computed(() =>
      uploading.value ||
      messages.value.some(m => m.role === 'ai' && (m.status === AI_TYPING || m.status === AI_PROGRESS))
    )

    // 三档徽章: 红 ws 没连 / 黄 ws 连但 ai 没连 / 绿 都连
    const canSend = computed(() => authed.value && connStatus.value === CONN_READY && !inFlight.value)
    const connStatusClass = computed(() => ({
      'is-ready': connStatus.value === CONN_READY && aiConnected.value,
      'is-warn':  connStatus.value === CONN_READY && !aiConnected.value,
      'is-busy':  connStatus.value === CONN_CONNECTING || connStatus.value === CONN_SENDING,
      'is-off':   connStatus.value === CONN_DISCONNECTED,
    }))
    const connStatusText = computed(() => {
      if (!authed.value) return '未登录'
      switch (connStatus.value) {
        case CONN_READY: return aiConnected.value ? '已连接' : '等待 AI'
        case CONN_CONNECTING: return '连接中'
        case CONN_SENDING: return '发送中'
        default: return '未连接'
      }
    })
    const connDetailText = computed(() => {
      switch (connStatus.value) {
        case CONN_CONNECTING: return '正在握手 WebSocket...'
        case CONN_DISCONNECTED: return '连接断了, 可点下面按钮重试'
        case CONN_READY:
          if (!aiConnected.value) return 'WS 已连, AI 端 (本地 Claude Code) 还没上线, 联系老公启动 skill'
          return ''
        default: return ''
      }
    })

    function reopenKeyDialog() {
      promptKey('请输入 AI 辅助密钥')
    }

    function manualReconnect() {
      reconnectDelay = 1000 // 重置退避, 立即试
      connect()
    }
    const sendBtnLabel = computed(() => {
      if (!authed.value) return '未登录'
      if (connStatus.value === CONN_CONNECTING) return '连接中'
      if (uploading.value) return '上传中'
      if (inFlight.value) return '处理中'
      if (connStatus.value === CONN_SENDING) return '发送中'
      return '发送'
    })

    function statusLabel(s) {
      switch (s) {
        case AI_TYPING: return '思考中…'
        case AI_PROGRESS: return '处理中…'
        case AI_DONE: return '✓ 完成'
        case AI_FAILED: return '× 失败'
        case AI_CANCELLED: return '⊘ 已停止'
        default: return ''
      }
    }

    function formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      return `${hh}:${mm}`
    }

    function promptKey(hint) {
      keyDialogHint.value = hint
      keyDialogError.value = ''
      accessKeyInput.value = ''
      keyDialogShow.value = true
    }

    // van-dialog before-close (Vant 4 签名): (action: 'confirm'|'cancel') => boolean | Promise<boolean>
    // 返回 true 关闭, false 留住. 不要假设有 done() 回调 (那是老版 vant).
    async function onKeyDialogConfirm(action) {
      if (action === 'cancel') {
        // 用户主动取消 → 关闭后回上一页
        nextTick(() => router.back())
        return true
      }
      const k = (accessKeyInput.value || '').trim()
      if (!k) {
        keyDialogError.value = '请输入密钥'
        return false
      }
      try {
        const resp = await relayLogin(k)
        applyTokens(resp)
        accessKeyInput.value = ''
        // 关闭 dialog 后再连 ws (避免 connect 抛错时 dialog 已关无法显错)
        nextTick(() => { connect() })
        return true
      } catch (e) {
        const msg = (e && e.message) || '登录失败'
        keyDialogError.value = msg
        return false
      }
    }

    function applyTokens(resp) {
      // request.js 拦截器把后端 {code,message,...} 顶层 return, 字段都在顶层;
      // 防御 wrapper 把 resp 再嵌套的场景
      const d = resp.data || resp
      accessToken = d.access_token || d.accessToken
      accessExpiresAt = Number(d.access_expires_at || d.accessExpiresAt) || 0
      // wsURL fallback: 后端没返就自拼; 跟着当前 page protocol 走 (http→ws, https→wss),
      // 避免 https 页面拼 ws 导致 Mixed Content / http 页面拼 wss 走不通
      const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      wsURL = d.ws_url || d.wsURL || `${wsProto}//${location.host}/forwarder/ws`
      try {
        const rt = d.refresh_token || d.refreshToken
        const rexp = d.refresh_expires_at || d.refreshExpiresAt
        if (rt) localStorage.setItem(REFRESH_TOKEN_KEY, rt)
        if (rexp) localStorage.setItem(REFRESH_EXP_KEY, String(rexp))
      } catch (_) {}
      authed.value = true
      console.log('[chat] applyTokens ok',
        'wsURL=', wsURL,
        'accessLen=', accessToken ? accessToken.length : 0,
        'accessExpAt=', accessExpiresAt,
        'expIn(sec)=', accessExpiresAt - Math.floor(Date.now() / 1000),
      )
      if (!accessToken) {
        showToast({ message: '后端没返 access_token, 检查 /relay-login 响应', type: 'fail' })
        return
      }
      scheduleRefresh()
    }

    function clearTokens() {
      accessToken = null
      accessExpiresAt = 0
      authed.value = false
      if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null }
      try {
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        localStorage.removeItem(REFRESH_EXP_KEY)
      } catch (_) {}
    }

    function scheduleRefresh() {
      if (refreshTimer) clearTimeout(refreshTimer)
      const nowSec = Math.floor(Date.now() / 1000)
      // 提前 60s 续; 如果 accessExpiresAt 异常 (0/过期/超大), 强制 13min 后再 refresh,
      // 避免每 5s 疯狂 refresh 把后端打挂
      const triggerAt = accessExpiresAt > nowSec + 60 ? accessExpiresAt - 60 : nowSec + 13 * 60
      const delay = Math.max(60, triggerAt - nowSec) * 1000 // 至少 60s, 防止任何情况下的快速循环
      console.log('[chat] scheduleRefresh in', delay / 1000, 's')
      refreshTimer = setTimeout(doRefresh, delay)
    }

    async function trySilentRefresh() {
      let rt, rexp
      try {
        rt = localStorage.getItem(REFRESH_TOKEN_KEY)
        rexp = Number(localStorage.getItem(REFRESH_EXP_KEY)) || 0
      } catch (_) { return false }
      if (!rt) return false
      if (rexp <= Math.floor(Date.now() / 1000)) {
        // 已过期, 不浪费一次调用
        clearTokens()
        return false
      }
      try {
        const resp = await relayRefresh(rt)
        applyTokens(resp)
        await connect()
        return true
      } catch (e) {
        // refresh 失败 → 清掉, 让上层弹密钥框
        clearTokens()
        return false
      }
    }

    async function doRefresh() {
      let rt
      try { rt = localStorage.getItem(REFRESH_TOKEN_KEY) } catch (_) {}
      if (!rt) {
        clearTokens()
        promptKey('登录过期, 请重新输入密钥')
        return
      }
      try {
        const resp = await relayRefresh(rt)
        applyTokens(resp)
        // 不再断开重连(那会拦腰打断"改代码并部署"的长轮、丢 REPLY).
        // 活 socket 上发 REAUTH 把新 access 告诉转发器, socket 保持不断; socket 不在才回退到重连.
        if (ws && ws.readyState === WebSocket.OPEN && accessToken) {
          try {
            ws.send(JSON.stringify({
              id: 'reauth',
              type: 'ENVELOPE_TYPE_REAUTH',
              metadata: { access_token: accessToken },
              timestampMs: Date.now(),
            }))
          } catch (_) {
            reconnectWS()
          }
        } else {
          reconnectWS()
        }
      } catch (e) {
        clearTokens()
        if (ws) { try { ws.close(1000, 'refresh failed') } catch (_) {} ws = null }
        connStatus.value = CONN_DISCONNECTED
        promptKey('登录过期, 请重新输入密钥')
      }
    }

    function reconnectWS() {
      if (ws) { try { ws.close(1000, 'reconnect') } catch (_) {} ws = null }
      connect()
    }

    async function connect() {
      if (!authed.value) { console.log('[chat] connect skip: not authed'); return }
      if (!accessToken) { console.log('[chat] connect skip: no accessToken'); return }
      if (!wsURL)       { console.log('[chat] connect skip: no wsURL'); return }
      if (connStatus.value === CONN_CONNECTING || connStatus.value === CONN_READY) {
        console.log('[chat] connect skip: already', connStatus.value)
        return
      }
      connStatus.value = CONN_CONNECTING
      console.log('[chat] new WebSocket', wsURL, 'subproto bearer.<len=' + accessToken.length + '>')
      try {
        ws = new WebSocket(wsURL, ['bearer.' + accessToken])
      } catch (e) {
        console.error('[chat] new WebSocket throw', e)
        showToast({ message: 'WS 构造失败: ' + (e && e.message), type: 'fail' })
        connStatus.value = CONN_DISCONNECTED
        scheduleReconnect()
        return
      }

      ws.onopen = () => {
        console.log('[chat] ws onopen')
        connStatus.value = CONN_READY
        reconnectDelay = 1000
      }

      ws.onmessage = (ev) => {
        let env
        try { env = JSON.parse(ev.data) } catch (_) { return }
        handleIncoming(env)
      }

      ws.onclose = (ev) => {
        console.log('[chat] ws onclose code=', ev.code, 'reason=', ev.reason, 'wasClean=', ev.wasClean)
        connStatus.value = CONN_DISCONNECTED
        aiConnected.value = false // ws 都断了, ai 状态归零
        // 断连即释放 in-flight 锁(否则 #1 守卫会让发送键永久锁死). 暂无服务端重放, 结果已丢, 结 failed 给重试入口.
        // 注: 当前 token 刷新会主动断连重连(#7 未做), 故刷新边界上的长轮会被结 failed —— 这正是 #7 要消除的.
        failInFlightTurns('连接中断，请重连后重发')
        if (ev.code === 1008) {
          showToast({ message: '另一会话已抢占连接', type: 'fail' })
          return
        }
        // 不重连的场景: 已登出 / refresh 失败
        if (!authed.value) return
        scheduleReconnect()
      }

      ws.onerror = (e) => {
        console.warn('[chat] ws onerror', e)
      }
    }

    function scheduleReconnect() {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, reconnectDelay)
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX)
    }

    async function onSend() {
      if (!canSend.value || uploading.value) return
      const text = draft.value.trim()
      const file = pendingFile.value
      if (!text && !file) return

      // 守卫: AI 端没连就别发 (不消耗输入, 她可稍后再发)
      if (!aiConnected.value) {
        showToast({ message: 'AI 还没连接, 等下再发', type: 'fail' })
        return
      }

      // 有附件先上传到私有桶, 拿带签名 token 的临时下载地址
      let fileMeta = null
      if (file) {
        uploading.value = true
        try {
          const resp = await uploadChatFile(file)
          const d = resp.data || resp
          const rel = d.file_url
          if (!rel) throw new Error('上传无返回地址')
          fileMeta = {
            // 拼绝对地址给 CC curl (chat 当前是 http://193.112.111.2)
            file_url: location.origin + rel,
            file_name: d.file_name || file.name,
            file_mime: d.file_mime || file.type || '',
            file_size: String(d.file_size || file.size || 0),
          }
        } catch (e) {
          uploading.value = false
          showToast({ message: '文件上传失败: ' + ((e && e.message) || ''), type: 'fail' })
          return
        }
        uploading.value = false
      }

      draft.value = ''
      pendingFile.value = null
      dispatch(text, fileMeta, file ? file.name : null)
    }

    // 真正组帧 + 推气泡 + 发送; onSend 与 重试 共用. content/fileMeta 此时已就绪.
    function dispatch(text, fileMeta, fileName) {
      const msgID = genId()
      const reqContent = text || (fileMeta ? '请处理这个文件' : '')
      // 用户气泡 (含附件 chip)
      messages.value.push({
        id: 'u-' + msgID,
        role: 'user',
        content: text,
        file: fileName ? { name: fileName } : null,
        timestamp: Date.now(),
      })
      const aiPlaceholder = {
        id: msgID,
        role: 'ai',
        content: '',
        status: AI_TYPING,
        progressNote: '',
        timestamp: Date.now(),
        // 留存原始指令, 失败后可一键重试 / 编辑后重发 (始终用新 id, 绝不复用旧 id)
        reqContent,
        reqMetadata: fileMeta || null,
        reqFileName: fileName || null,
      }
      messages.value.push(aiPlaceholder)
      scrollBottom(true)

      connStatus.value = CONN_SENDING
      const env = {
        id: msgID,
        sessionId: sessionId.value,
        type: 'ENVELOPE_TYPE_REQUEST',
        content: reqContent,
        timestampMs: Date.now(),
      }
      if (fileMeta) env.metadata = fileMeta // 复用 Envelope.metadata 透传文件引用, 协议零改动
      try {
        ws.send(JSON.stringify(env))
        connStatus.value = CONN_READY
      } catch (e) {
        aiPlaceholder.status = AI_FAILED
        aiPlaceholder.content = '发送失败, 请稍后重试'
        connStatus.value = CONN_DISCONNECTED
        scheduleReconnect()
      }
    }

    // 取原始指令: 优先气泡上留存的 reqContent; 老的持久化气泡没有就回退到配对的 user 气泡文本.
    function srcTextOf(msg) {
      if (msg.reqContent != null) return msg.reqContent
      const u = messages.value.find(m => m.id === 'u-' + msg.id)
      return u ? (u.content || '') : ''
    }

    // 失败气泡重试: 用原始指令重发 (附件场景沿用已上传的 fileMeta, 24h 内有效).
    function retryMessage(msg) {
      if (inFlight.value) { showToast({ message: '还有一条在处理中, 等它完成', type: 'fail' }); return }
      if (connStatus.value !== CONN_READY) { showToast({ message: '连接没就绪, 稍后再试', type: 'fail' }); return }
      if (!aiConnected.value) { showToast({ message: 'AI 还没连接, 等下再发', type: 'fail' }); return }
      dispatch(srcTextOf(msg), msg.reqMetadata || null, msg.reqFileName || null)
    }

    // 编辑后重发: 把原始指令回填草稿, 改完再发.
    function editResend(msg) {
      draft.value = srcTextOf(msg)
    }

    async function copyMessage(msg) {
      const t = msg.content || ''
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(t)
        } else {
          const ta = document.createElement('textarea')
          ta.value = t
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
        }
        showToast({ message: '已复制', type: 'success' })
      } catch (_) {
        showToast({ message: '复制失败', type: 'fail' })
      }
    }

    // 停止: 给进行中的那一轮发 CANCEL. 真正能不能停取决于 CC 端协作式 abort;
    // 这里负责发出取消意图 + 把气泡置 cancelling(显示"正在停止…"), 收到 CANCELLED/终态后解除.
    function onCancel() {
      const ai = messages.value.find(m => m.role === 'ai' && (m.status === AI_TYPING || m.status === AI_PROGRESS))
      if (!ai || ai.cancelling) return
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        showToast({ message: '连接断开，无法停止', type: 'fail' })
        return
      }
      ai.cancelling = true
      ai.progressNote = '正在停止…（若正在部署，可能要等收尾）'
      try {
        ws.send(JSON.stringify({
          id: ai.id,
          sessionId: sessionId.value,
          type: 'ENVELOPE_TYPE_CANCEL',
          timestampMs: Date.now(),
        }))
      } catch (e) {
        ai.cancelling = false
        showToast({ message: '停止发送失败，请重试', type: 'fail' })
      }
    }

    // 渲染 AI 回复为净化后的 markdown HTML (代码/diff/列表在手机上才不错乱).
    function renderMarkdown(text) {
      if (!text) return ''
      try {
        return DOMPurify.sanitize(md.render(String(text)))
      } catch (_) {
        return DOMPurify.sanitize(String(text))
      }
    }

    // 输入框键位契约: 桌面 Enter 发送 / Shift+Enter 换行; 输入法合成中(IME)不拦截.
    // 手机软键盘 Enter 仍走换行, 发送靠按钮 —— 合成守卫保证中文输入选词的回车不误发.
    function onKeydown(e) {
      if (e.key !== 'Enter') return
      if (e.isComposing || e.keyCode === 229) return
      if (e.shiftKey) return
      e.preventDefault()
      onSend()
    }

    // 释放 in-flight 锁: 把仍在 typing/progress 的 AI 气泡结成 failed 终态.
    // 必要性: #1 的 inFlight 守卫会在"断连 / AI 掉线"且(暂)无服务端重放时, 让气泡永远 typing →
    // 发送键被永久锁死(软死锁). 这里在 onclose / AI 掉线时主动给终态解锁, 并给可重试入口.
    // (服务端重放 #8 + REAUTH 不断连 #7 落地后, 这里应改为"恢复中…"的优雅路径, 而非直接 failed.)
    function failInFlightTurns(reason) {
      for (const m of messages.value) {
        if (m.role === 'ai' && (m.status === AI_TYPING || m.status === AI_PROGRESS)) {
          m.status = AI_FAILED
          if (!m.content) m.content = reason
          m.progressNote = ''
        }
      }
    }

    function handleIncoming(env) {
      const type = env.type
      // PEER_STATUS: 转发器告知 AI 端连接状态, 用于徽章三档色 + 发消息守卫
      if (type === 'ENVELOPE_TYPE_PEER_STATUS') {
        const ai = env.metadata?.ai_connected === 'true'
        console.log('[chat] peer status: ai_connected =', ai)
        const wasInFlight = inFlight.value
        aiConnected.value = ai
        // AI 端在某轮处理中掉线: 无服务端重放时结果已丢, 结终态解锁(文案非承诺式).
        if (!ai && wasInFlight) failInFlightTurns('AI 端掉线，本次处理可能已中断，请确认后重发')
        return
      }
      // REAUTH_OK: 转发器确认活 socket 上换 token 成功, 无需断连. 仅记录.
      if (type === 'ENVELOPE_TYPE_REAUTH_OK') {
        console.log('[chat] reauth ok, exp=', env.metadata?.access_expires_at)
        return
      }
      const reqId = env.id
      const ai = messages.value.find(m => m.id === reqId && m.role === 'ai')
      if (!ai) return
      const content = env.content || ''
      // 终态守卫: 已 done/failed/cancelled 的气泡, 丢弃迟到的非权威帧,
      // 防迟到 PROGRESS 把"已停止/已完成"翻回处理中来回振荡 (重连/重放时尤为关键).
      const isTerminal = ai.status === AI_DONE || ai.status === AI_FAILED || ai.status === AI_CANCELLED
      if (type === 'ENVELOPE_TYPE_STARTED') {
        // CC 真正开始处理 (映射 SDK system/init); 思考中只在此后才算"在跑".
        if (!isTerminal) { ai.status = AI_PROGRESS; if (!ai.progressNote) ai.progressNote = '已开始处理' }
      } else if (type === 'ENVELOPE_TYPE_DELTA') {
        // 流式文本增量: 累加到气泡 (CC skill 多次 POST delta 时才会有; 没有也无害).
        if (!isTerminal) {
          ai.status = AI_PROGRESS
          ai.content = (ai.content || '') + content
          ai.progressNote = ''
        }
      } else if (type === 'ENVELOPE_TYPE_PROGRESS') {
        if (isTerminal) return
        ai.status = AI_PROGRESS
        const step = env.metadata?.step
        const tool = env.metadata?.tool
        ai.progressNote = tool ? `${step || '处理'}: ${tool}` : (step || '处理中')
      } else if (type === 'ENVELOPE_TYPE_REPLY') {
        // REPLY 是权威全文: 即便此前被 hydrate 误判 failed, 真结果到了也接受(恢复).
        ai.status = AI_DONE
        ai.content = content || '(无内容)'
        ai.progressNote = ''
        ai.flash = true
        setTimeout(() => { ai.flash = false }, 1200)
      } else if (type === 'ENVELOPE_TYPE_ERROR') {
        if (ai.status === AI_DONE) return // 已成功, 迟到 ERROR 不得覆盖
        ai.status = AI_FAILED
        ai.content = content || '处理失败'
        ai.progressNote = ''
      } else if (type === 'ENVELOPE_TYPE_CANCELLED') {
        // 取消终态 (为"停止"功能预留): 只对进行中气泡生效, 不覆盖已 done/failed 历史.
        if (ai.status === AI_DONE || ai.status === AI_FAILED) return
        ai.status = AI_CANCELLED
        ai.content = content || '已停止'
        ai.progressNote = ''
      }
      scrollBottom()
    }

    function onScroll() {
      const el = scrollRef.value
      if (!el) return
      isPinned.value = (el.scrollHeight - el.scrollTop - el.clientHeight) < 48
      if (isPinned.value) hasNewBelow.value = false
    }

    // force=true: 用户自己发消息等场景强制滚到底; 否则只在贴底时跟随, 不打断上滑阅读.
    async function scrollBottom(force) {
      await nextTick()
      const el = scrollRef.value
      if (!el) return
      if (force || isPinned.value) {
        el.scrollTop = el.scrollHeight
        hasNewBelow.value = false
      } else {
        hasNewBelow.value = true
      }
    }

    function jumpToBottom() {
      const el = scrollRef.value
      if (el) el.scrollTop = el.scrollHeight
      isPinned.value = true
      hasNewBelow.value = false
    }

    return {
      draft, messages, scrollRef,
      canSend, inFlight, connStatus, connStatusClass, connStatusText, connDetailText, sendBtnLabel,
      onSend, statusLabel, formatTime,
      authed, aiConnected, keyDialogShow, keyDialogHint, keyDialogError, accessKeyInput,
      onKeyDialogConfirm, reopenKeyDialog, manualReconnect,
      pendingFile, uploading, onPickFile, removePendingFile,
      onScroll, hasNewBelow, jumpToBottom,
      retryMessage, editResend, copyMessage, onCancel,
      renderMarkdown, onKeydown,
    }
  },
}
</script>

<style lang="scss" scoped>
.admin-chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f6f8;
  position: relative; /* 锚定"↓ 新消息" chip */
}

.conn-badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  gap: 4px;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #999;
    display: inline-block;
  }
  &.is-ready  .dot { background: #07c160; }                                    /* 绿 ws + ai 都连 */
  &.is-warn   .dot { background: #ffd21f; animation: blink 1.5s infinite; }    /* 黄 ws 连 / ai 未连 */
  &.is-busy   .dot { background: #ff9800; animation: blink 1s infinite; }      /* 橙 连接中 */
  &.is-off    .dot { background: #ee0a24; }                                    /* 红 ws 未连 */
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  -webkit-overflow-scrolling: touch;
}

.empty-tip {
  text-align: center;
  color: #999;
  margin-top: 80px;
  font-size: 14px;

  .empty-sub {
    font-size: 12px;
    color: #bbb;
    margin-top: 8px;
  }
}

.msg-card {
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: background 0.6s ease;

  &.role-user {
    background: #eaf4ff;
    margin-left: 32px;
  }
  &.role-ai {
    margin-right: 32px;
  }
  &.flash {
    background: #fff7d6;
  }

  &.status-failed { border-left: 3px solid #ee0a24; }
  &.status-done   { border-left: 3px solid #07c160; }
  &.status-cancelled { border-left: 3px solid #969799; }
  &.status-typing,
  &.status-progress { border-left: 3px solid #ff9800; }
}

.msg-actions {
  margin-top: 8px;
  display: flex;
  gap: 16px;

  .act {
    font-size: 12px;
    color: #1989fa;
    cursor: pointer;
    user-select: none;
  }
}

.new-msg-chip {
  position: absolute;
  left: 50%;
  bottom: 88px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 16px;
  z-index: 10;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.msg-meta {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;

  .role-label { font-weight: 600; color: #333; }
  .ts         { margin-left: auto; }
  .status-badge { color: #ff9800; }
}

.msg-content {
  font-size: 14px;
  line-height: 1.5;
  color: #222;
  white-space: pre-wrap;
  word-break: break-word;
}

/* AI 回复的 markdown 渲染 (代码块/列表/表格) */
.msg-content.md {
  white-space: normal;

  :deep(p) { margin: 0 0 8px; }
  :deep(p:last-child) { margin-bottom: 0; }
  :deep(pre) {
    background: #f6f8fa;
    border-radius: 6px;
    padding: 10px;
    overflow-x: auto;
    margin: 8px 0;
  }
  :deep(code) {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 12px;
    background: #f0f1f2;
    padding: 1px 4px;
    border-radius: 4px;
    word-break: break-word;
  }
  :deep(pre code) { background: transparent; padding: 0; }
  :deep(ul), :deep(ol) { margin: 6px 0; padding-left: 20px; }
  :deep(a) { color: #1989fa; word-break: break-all; }
  :deep(h1), :deep(h2), :deep(h3) { font-size: 15px; margin: 8px 0 4px; }
  :deep(blockquote) {
    margin: 6px 0;
    padding-left: 10px;
    border-left: 3px solid #dcdee0;
    color: #646566;
  }
  :deep(table) { border-collapse: collapse; margin: 6px 0; }
  :deep(td), :deep(th) { border: 1px solid #ebedf0; padding: 4px 8px; }
}

.msg-progress {
  margin-top: 6px;
  font-size: 12px;
  color: #888;
  font-style: italic;
}

.msg-file {
  margin-top: 6px;
  font-size: 12px;
  color: #1989fa;
  background: #f0f7ff;
  border-radius: 6px;
  padding: 4px 8px;
  display: inline-block;
  word-break: break-all;
}

.pending-file {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-top: 1px solid #ebedf0;
  padding: 8px 12px;
  font-size: 13px;
  color: #333;

  .pf-name { flex: 1; word-break: break-all; color: #1989fa; }
  .pf-size { color: #999; font-size: 12px; }
  .pf-remove { color: #999; font-size: 18px; padding: 4px; }
}

.chat-input-bar {
  background: #fff;
  border-top: 1px solid #ebedf0;
  padding: 8px 12px;
  display: flex;
  align-items: flex-end;
  gap: 8px;

  .attach-btn {
    font-size: 26px;
    color: #1989fa;
    padding: 6px 2px;
    flex-shrink: 0;
    cursor: pointer;
    &.disabled { color: #c8c9cc; cursor: not-allowed; }
  }

  :deep(.van-field) {
    flex: 1;
    background: #f5f6f8;
    border-radius: 8px;
    padding: 6px 10px;
  }
  .van-button {
    height: 40px;
    border-radius: 20px;
    padding: 0 16px;
    flex-shrink: 0;
  }
}

.key-dialog-body {
  padding: 16px 20px 8px;

  .hint {
    color: #666;
    font-size: 13px;
    margin-bottom: 12px;
  }
  .error-msg {
    color: #ee0a24;
    font-size: 12px;
    margin-top: 8px;
  }
  :deep(.van-field) {
    background: #f5f6f8;
    border-radius: 6px;
    padding: 6px 10px;
  }
}
</style>
