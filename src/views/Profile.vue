<template>
  <div class="profile-page"
       @touchstart="handleTouchStart"
       @touchmove="handleTouchMove"
       @touchend="handleTouchEnd">
    <!-- 头部信息 -->
    <header class="profile-header">
      <span class="es-eyebrow head-eyebrow">My&nbsp;Account</span>
      <div class="head-row">
        <div class="user-avatar">
          <van-image
            :src="avatarUrl"
            round
            width="80"
            height="80"
            fit="cover"
            @click="showAvatarPicker"
          >
            <template #error>
              <div class="avatar-placeholder">
                <van-icon name="user-o" size="40" />
              </div>
            </template>
          </van-image>
          <div class="camera-icon" @click="showAvatarPicker">
            <van-icon name="photograph" size="16" />
          </div>
        </div>
        <div class="user-basic-info">
          <h2 class="username">{{ userInfo.name || '未设置' }}</h2>
          <p class="user-id">ID&nbsp;{{ userInfo.id }}</p>
        </div>
      </div>
    </header>

    <!-- 用户信息列表 -->
    <div class="profile-content">
      <section class="es-section">
        <p class="es-eyebrow section-label">账户资料</p>
        <div class="es-card list-card">
          <van-cell-group :border="false">
            <van-cell
              title="用户名"
              :value="userInfo.name || '未设置'"
              is-link
              @click="editUserField('name', '用户名', userInfo.name)"
            />
            <van-cell
              title="账号"
              :value="userInfo.account || '未设置'"
              :clickable="false"
            />
            <van-cell
              title="手机号"
              :value="userInfo.phone || '未设置'"
              is-link
              @click="editUserField('phone', '手机号', userInfo.phone)"
            />
            <van-cell
              title="邮箱"
              :value="userInfo.email || '未设置'"
              is-link
              @click="editUserField('email', '邮箱', userInfo.email)"
            />
            <van-cell
              title="修改密码"
              icon="lock"
              is-link
              @click="openPasswordPopup"
            />
          </van-cell-group>
        </div>
      </section>

      <!-- 我的标签 -->
      <section class="es-section">
        <p class="es-eyebrow section-label">收藏与内容</p>
        <div class="es-card list-card">
          <van-cell-group :border="false">
            <van-cell
              title="我的标签"
              icon="label-o"
              is-link
              @click="$router.push('/profile/tags')"
            />
          </van-cell-group>
        </div>
      </section>

      <!-- AI 辅助 - 仅 admin 可见 (前端隐藏 + 后端二次校验) -->
      <section v-if="adminMode" class="es-section">
        <p class="es-eyebrow section-label">管理</p>
        <div class="es-card list-card">
          <van-cell-group :border="false">
            <van-cell
              title="AI 辅助"
              label="跟 AI 说一下要改什么, 自动改+部署 (新窗口打开)"
              icon="chat-o"
              is-link
              @click="openAdminChat"
            />
          </van-cell-group>
        </div>
      </section>

      <!-- 导入任务 -->
      <ImportTaskList />

      <!-- 操作按钮 -->
      <div class="profile-actions">
        <van-button
          type="danger"
          size="large"
          block
          @click="handleLogout"
        >
          退出登录
        </van-button>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <van-popup
      v-model:show="showEditPopup"
      position="bottom"
      :style="{ height: '40%' }"
    >
      <div class="edit-popup">
        <div class="popup-header">
          <van-button type="default" size="small" @click="cancelEdit">取消</van-button>
          <h3>编辑{{ editTitle }}</h3>
          <van-button type="primary" size="small" @click="saveEdit">保存</van-button>
        </div>
        <div class="popup-content">
          <van-field
            v-model="editValue"
            :placeholder="`请输入${editTitle}`"
            :rules="getFieldRules(editField)"
            clearable
            autosize
          />
        </div>
      </div>
    </van-popup>
    
    <!-- 头像选择弹窗 -->
    <van-popup
      v-model:show="showAvatarPopup"
      position="bottom"
      :style="{ height: '30%' }"
    >
      <div class="avatar-popup">
        <div class="popup-header">
          <h3>更换头像</h3>
        </div>
        <div class="avatar-options">
          <van-button type="primary" size="large" block @click="selectAvatar">
            选择图片
          </van-button>
          <van-button type="default" size="large" block @click="showAvatarPopup = false">
            取消
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 修改密码弹窗 -->
    <van-popup
      v-model:show="showPasswordPopup"
      position="bottom"
      :style="{ height: '52%' }"
    >
      <div class="edit-popup pwd-popup">
        <div class="popup-header">
          <van-button type="default" size="small" @click="cancelPassword">取消</van-button>
          <h3>修改密码</h3>
          <van-button type="primary" size="small" :loading="pwdLoading" @click="submitPassword">保存</van-button>
        </div>
        <div class="popup-content">
          <van-form ref="pwdForm" autocomplete="off" @submit="submitPassword">
            <van-field
              v-model="pwdData.oldPassword"
              type="password"
              name="oldPassword"
              label="原密码"
              placeholder="请输入原密码"
              :rules="oldPasswordRules"
              autocomplete="current-password"
              clearable
            />
            <van-field
              v-model="pwdData.newPassword"
              type="password"
              name="newPassword"
              label="新密码"
              placeholder="请输入新密码（8-64位）"
              :rules="newPasswordRules"
              autocomplete="new-password"
              clearable
            />
            <van-field
              v-model="pwdData.confirmPassword"
              type="password"
              name="confirmPassword"
              label="确认新密码"
              placeholder="请再次输入新密码"
              :rules="confirmNewPasswordRules"
              autocomplete="new-password"
              clearable
            />
          </van-form>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getUserInfo, updateUserInfo, updateUserAvatar, changePassword } from '@/api/user'
import { getUserInfo as getLocalUserInfo, setUserInfo, clearAllData, removeSavedCredentials, isAdmin } from '@/utils/auth'
import { getResourceUrl } from '@/utils/request'
import { validatePasswordStrength } from '@/utils/password'
import ImportTaskList from '@/components/profile/ImportTaskList.vue'

export default {
  name: 'Profile',
  components: { ImportTaskList },
  setup() {
    const router = useRouter()
    // 是否显示 AI 辅助入口 (admin only); 计算只在 mount 时算一次, role 不会运行时变
    const adminMode = isAdmin()
    const userInfo = reactive({
      id: '',
      name: '',
      account: '',
      phone: '',
      email: '',
      avatar: ''
    })
    
    const showEditPopup = ref(false)
    const showAvatarPopup = ref(false)
    const editField = ref('')
    const editTitle = ref('')
    const editValue = ref('')
    const loading = ref(false)

    // 修改密码相关
    const showPasswordPopup = ref(false)
    const pwdLoading = ref(false)
    const pwdForm = ref(null)
    const pwdData = reactive({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    const oldPasswordRules = [
      { required: true, message: '请输入原密码' }
    ]
    const newPasswordRules = [
      { required: true, message: '请输入新密码' },
      // 与后端密码强度一致: 返回 true=通过, 返回字符串=错误文案
      { validator: (v) => { const r = validatePasswordStrength(v); return r === true ? true : r } }
    ]
    const confirmNewPasswordRules = [
      { required: true, message: '请确认新密码' },
      { validator: (v) => v === pwdData.newPassword ? true : '两次输入的新密码不一致' }
    ]
    
    // 滑动手势相关
    const touchStartX = ref(0)
    const touchStartY = ref(0)
    const isSwipeGesture = ref(false)
    
    const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNGNUY1RjUiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzMiIgcj0iMTIiIGZpbGw9IiNEREREREQiLz4KPHBhdGggZD0iTTIwIDYwQzIwIDUyLjI2ODQgMjYuMjY4NCA0NiAzNCA0Nkg0NkM1My43MzE2IDQ2IDYwIDUyLjI2ODQgNjAgNjBWNjhIMjBWNjBaIiBmaWxsPSIjREREREREIi8+Cjwvc3ZnPgo='
    
    // 计算头像URL，使用通用的资源URL处理方法
    const avatarUrl = computed(() => {
      if (!userInfo.avatar) {
        return defaultAvatar
      }
      
      // 使用通用方法处理资源URL
      return getResourceUrl(userInfo.avatar)
    })
    
    // 加载用户信息
    const loadUserInfo = async () => {
      try {
        const localUser = getLocalUserInfo()
        if (localUser) {
          Object.assign(userInfo, localUser)
          
          // 从服务器获取最新信息
          const response = await getUserInfo(localUser.id)
          Object.assign(userInfo, response.data)
          setUserInfo(response.data)
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }
    
    // 编辑字段
    const editUserField = (field, title, value) => {
      editField.value = field
      editTitle.value = title
      editValue.value = value || ''
      showEditPopup.value = true
    }
    
    // 取消编辑
    const cancelEdit = () => {
      showEditPopup.value = false
      editField.value = ''
      editTitle.value = ''
      editValue.value = ''
    }
    
    // 保存编辑
    const saveEdit = async () => {
      if (loading.value) return
      
      try {
        loading.value = true
        
        const updateData = {
          data: {
            ...userInfo,
            [editField.value]: editValue.value,
            avatar: '' // 在更新其他字段时，avatar字段传空，避免将完整的HTTP URL回传给后端
          }
        }
        
        const response = await updateUserInfo(userInfo.id, updateData)
        
        // 更新本地数据
        userInfo[editField.value] = editValue.value
        setUserInfo(userInfo)
        
        showToast({
          message: '更新成功',
          type: 'success'
        })
        
        cancelEdit()
        
      } catch (error) {
        console.error('更新失败:', error)
        // 不在这里显示错误信息，因为request.js的响应拦截器已经处理了
      } finally {
        loading.value = false
      }
    }
    
    // 获取字段验证规则
    const getFieldRules = (field) => {
      switch (field) {
        case 'name':
          return [
            { required: true, message: '请输入用户名' },
            { min: 2, max: 10, message: '用户名长度为2-10位' }
          ]
        case 'phone':
          return [
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]
        case 'email':
          return [
            { required: true, message: '请输入邮箱地址' },
            { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱地址' }
          ]
        default:
          return []
      }
    }
    
    // 显示头像选择器
    const showAvatarPicker = () => {
      showAvatarPopup.value = true
    }
    
    // 选择头像
    const selectAvatar = async () => {
      if (loading.value) return
      
      try {
        loading.value = true
        showAvatarPopup.value = false
        
        showToast({
          message: '正在上传头像...',
          type: 'loading',
          duration: 0
        })
        
        // 调用头像更新流程
        const updatedUserInfo = await updateUserAvatar(userInfo.id)
        
        // 更新本地用户信息
        Object.assign(userInfo, updatedUserInfo.data)
        setUserInfo(updatedUserInfo.data)
        
        showToast({
          message: '头像更新成功',
          type: 'success'
        })
        
      } catch (error) {
        console.error('头像上传失败:', error)
        // 不在这里显示错误信息，因为request.js的响应拦截器已经处理了
      } finally {
        loading.value = false
      }
    }
    
    // 打开修改密码弹窗
    const openPasswordPopup = () => {
      pwdData.oldPassword = ''
      pwdData.newPassword = ''
      pwdData.confirmPassword = ''
      showPasswordPopup.value = true
    }

    // 取消修改密码
    const cancelPassword = () => {
      showPasswordPopup.value = false
      pwdData.oldPassword = ''
      pwdData.newPassword = ''
      pwdData.confirmPassword = ''
    }

    // 提交修改密码
    const submitPassword = async () => {
      if (pwdLoading.value) return

      // 手动触发表单校验 (保存按钮不是 native submit, 走 van-form 的 validate)
      try {
        await pwdForm.value?.validate()
      } catch (e) {
        return
      }

      // 新密码不能与原密码相同(后端也会拦, 这里给即时提示)
      if (pwdData.newPassword === pwdData.oldPassword) {
        showToast({ message: '新密码不能与原密码相同', type: 'fail' })
        return
      }

      try {
        pwdLoading.value = true

        await changePassword({
          old_password: pwdData.oldPassword,
          new_password: pwdData.newPassword
        })

        showToast({
          message: '密码修改成功，请重新登录',
          type: 'success'
        })

        cancelPassword()

        // 改密后令牌可能仍有效, 但出于安全让用户用新密码重新登录;
        // 同时清掉"记住密码"里已失效的旧密码, 免得登录页自动填回旧密码导致一次登录失败
        clearAllData()
        removeSavedCredentials()
        router.push('/login')

      } catch (error) {
        console.error('修改密码失败:', error)
        // 失败信息 (原密码错误/强度不达标等) 由 request.js 响应拦截器统一 toast
      } finally {
        pwdLoading.value = false
      }
    }

    // 退出登录
    const handleLogout = async () => {
      try {
        await showConfirmDialog({
          title: '提示',
          message: '确定要退出登录吗？'
        })
        
        clearAllData()
        
        showToast({
          message: '已退出登录',
          type: 'success'
        })
        
        router.push('/login')
        
      } catch (error) {
        // 用户取消
      }
    }
    
    // 触摸事件处理
    const handleTouchStart = (e) => {
      touchStartX.value = e.touches[0].clientX
      touchStartY.value = e.touches[0].clientY
      isSwipeGesture.value = false
    }

    const handleTouchMove = (e) => {
      if (!touchStartX.value) return
      
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const deltaX = currentX - touchStartX.value
      const deltaY = currentY - touchStartY.value
      
      // 判断是否为水平滑动
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isSwipeGesture.value = true
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e) => {
      if (!touchStartX.value || !isSwipeGesture.value) return
      
      const endX = e.changedTouches[0].clientX
      const deltaX = endX - touchStartX.value
      
      // 右滑切换到词典页面
      if (deltaX > 50) {
        router.push('/dictionary')
      }
      
      touchStartX.value = 0
      touchStartY.value = 0
      isSwipeGesture.value = false
    }
    
    // 打开 AI 辅助: 在新标签页打开, 当前"我的"页**保持不动** (改完代码去别页看, 回来对话历史还在).
    //
    // 关键点:
    // 1) 不要用 'noopener' 特性 —— 按规范带 noopener 时 window.open 永远返回 null, 会让"被拦截"判断误判,
    //    进而触发降级 router.push 把当前页也带进 /admin/chat (出现"两个页面都进了聊天 + 抢 ws"的 bug).
    //    同源自家页面没有 reverse tabnabbing 风险, 不需要 noopener.
    // 2) 具名 target 'es-admin-chat' (而非 _blank): 已经开着 chat 标签时再点 → 聚焦复用同一个,
    //    不会开出第二个 → 避免多标签抢转发器那唯一的 ws 单连接.
    // 3) 微信内置浏览器开不了真新标签 → 只能同标签跳 (localStorage 持久化兜底, 历史不丢).
    const openAdminChat = () => {
      const isWeChat = /micromessenger/i.test(navigator.userAgent || '')
      if (isWeChat) {
        router.push('/admin/chat')
        return
      }
      const href = router.resolve('/admin/chat').href
      const win = window.open(href, 'es-admin-chat')
      if (!win) {
        // 真被弹窗拦截 (极少见, 因为这是点击触发) → 只提示, 绝不跳当前页
        showToast({ message: '请允许浏览器弹窗后再点一次', type: 'fail' })
      }
    }

    onMounted(() => {
      loadUserInfo()
    })

    return {
      adminMode,
      openAdminChat,
      userInfo,
      showEditPopup,
      showAvatarPopup,
      showPasswordPopup,
      pwdLoading,
      pwdForm,
      pwdData,
      oldPasswordRules,
      newPasswordRules,
      confirmNewPasswordRules,
      openPasswordPopup,
      cancelPassword,
      submitPassword,
      editUserField,
      editTitle,
      editValue,
      loading,
      defaultAvatar,
      avatarUrl,
      editField,
      cancelEdit,
      saveEdit,
      getFieldRules,
      showAvatarPicker,
      selectAvatar,
      handleLogout,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd
    }
  }
}
</script>

<style lang="scss" scoped>
/* ============================================================
   EDITORIAL — 我的 / Profile
   Sits on the global cool wash (App.vue paints --es-wash).
   No opaque page bg; content lives on soft white es-cards
   and hairline-separated van-cell rows.
   ============================================================ */

/* 滑动动画 */
.slide-enter-active {
  transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1);
}

.slide-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
  filter: blur(2px);
}

.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
  filter: blur(2px);
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
  filter: blur(0);
}

.profile-page {
  min-height: 100vh;
  /* let the global --es-wash show through */
  background: transparent;
  position: relative;
  overflow-x: hidden;
  color: var(--es-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
               'Hiragino Sans GB', 'Microsoft YaHei', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ---- editorial header on the wash ---- */
.profile-header {
  position: relative;
  padding: clamp(28px, 7vh, 48px) 24px 22px;
  text-align: left;
  color: var(--es-ink);
}

.head-eyebrow {
  display: block;
  margin-bottom: 18px;
  color: var(--es-ink-3);
}

.head-row {
  display: flex;
  align-items: center;
  gap: 18px;
}

.profile-header .user-avatar {
  position: relative;
  flex: 0 0 auto;
  display: inline-block;
  line-height: 0;

  /* the avatar image gets a soft ring + lift */
  :deep(.van-image) {
    border-radius: 50%;
    box-shadow:
      0 10px 26px -12px rgba(20, 30, 50, .35),
      0 0 0 4px var(--es-surface);
    overflow: hidden;
  }

  .avatar-placeholder {
    width: 80px;
    height: 80px;
    background: var(--es-hair-soft);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--es-ink-3);
  }

  .camera-icon {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, var(--es-grad-a), var(--es-primary));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    border: 2.5px solid var(--es-surface);
    box-shadow: 0 4px 12px rgba(25, 137, 250, .42);
    cursor: pointer;
    transition: transform .2s var(--es-ease);

    &:active {
      transform: scale(.9);
    }
  }
}

.profile-header .user-basic-info {
  min-width: 0;
  flex: 1 1 auto;

  .username {
    font-size: clamp(26px, 8vw, 34px);
    font-weight: 800;
    letter-spacing: -.02em;
    line-height: 1.08;
    color: var(--es-ink);
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-id {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 11px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .06em;
    color: var(--es-primary);
    background: rgba(25, 137, 250, .10);
  }
}

/* ---- settings sections ---- */
.profile-content {
  padding: 6px 20px 0;
}

.es-section {
  margin-bottom: 22px;
}

.section-label {
  margin: 0 4px 10px;
  color: var(--es-ink-3);
}

.list-card {
  padding: 4px 16px;
}

/* refined hairline list rows */
.list-card :deep(.van-cell-group) {
  background: transparent;
}
.list-card :deep(.van-cell-group--inset) {
  margin: 0;
}

.list-card :deep(.van-cell) {
  position: relative;
  padding: 16px 0;
  background: transparent;
  line-height: 1.4;
  align-items: center;

  /* kill Vant's own borders; we draw our own hairline */
  &::after {
    display: none;
  }

  & + .van-cell {
    border-top: 1px solid var(--es-hair);
  }

  .van-cell__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--es-ink);
  }

  .van-cell__label {
    font-size: 12px;
    color: var(--es-ink-3);
    margin-top: 4px;
    line-height: 1.5;
  }

  .van-cell__value {
    font-size: 15px;
    color: var(--es-ink-2);
  }

  /* leading icon → soft tinted chip */
  .van-cell__left-icon {
    width: 34px;
    height: 34px;
    margin-right: 12px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: var(--es-primary);
    background: rgba(25, 137, 250, .10);
  }

  /* refined chevron */
  .van-cell__right-icon {
    color: var(--es-ink-3);
    font-size: 16px;
  }
}

/* pressed feedback on tappable rows */
.list-card :deep(.van-cell--clickable:active) {
  background: var(--es-hair-soft);
  border-radius: 10px;
}

/* ---- logout / destructive action ---- */
.profile-actions {
  margin-top: 32px;

  :deep(.van-button--danger) {
    height: 50px;
    border-radius: var(--es-r-btn);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: .04em;
    color: #E1483B;
    background: rgba(225, 72, 59, .08);
    border: 1px solid rgba(225, 72, 59, .22);
    box-shadow: none;
    transition: background .2s var(--es-ease), transform .15s var(--es-ease);

    &:active {
      background: rgba(225, 72, 59, .14);
      transform: translateY(1px);
    }
  }
}

/* ============================================================
   Popups — editorial bottom sheets
   ============================================================ */
:deep(.van-popup) {
  border-radius: 20px 20px 0 0;
}

.edit-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--es-surface);

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px 16px;
    border-bottom: 1px solid var(--es-hair);

    h3 {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -.01em;
      color: var(--es-ink);
      margin: 0;
    }

    :deep(.van-button) {
      border-radius: 10px;
      font-weight: 600;
    }

    :deep(.van-button--default) {
      color: var(--es-ink-2);
      border-color: var(--es-hair);
      background: var(--es-surface);
    }

    :deep(.van-button--primary) {
      background: linear-gradient(118deg, var(--es-grad-a), var(--es-primary) 70%, var(--es-teal));
      border: 0;
      box-shadow: 0 6px 16px -6px rgba(25, 137, 250, .5);
    }
  }

  .popup-content {
    flex: 1;
    padding: 22px 20px;

    :deep(.van-field) {
      background: var(--es-hair-soft);
      border-radius: 12px;
      padding: 14px 14px;

      &::after {
        display: none;
      }

      .van-field__control {
        font-size: 16px;
        color: var(--es-ink);
      }
    }
  }
}

/* 修改密码弹窗: 三个字段堆叠, 各自卡片之间留间距 */
.pwd-popup {
  .popup-content :deep(.van-form) {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}

.avatar-popup {
  padding: 22px 20px calc(22px + env(safe-area-inset-bottom, 0px));
  background: var(--es-surface);

  .popup-header {
    text-align: center;
    margin-bottom: 22px;

    h3 {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -.01em;
      color: var(--es-ink);
      margin: 0;
    }
  }

  .avatar-options {
    :deep(.van-button) {
      margin-bottom: 12px;
      height: 50px;
      border-radius: var(--es-r-btn);
      font-size: 16px;
      font-weight: 700;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(.van-button--primary) {
      letter-spacing: .04em;
      background: linear-gradient(118deg, var(--es-grad-a) 0%, var(--es-primary) 56%, var(--es-teal) 130%);
      background-size: 180% 180%;
      border: 0;
      box-shadow:
        0 10px 24px rgba(25, 137, 250, .32),
        inset 0 1px 0 rgba(255, 255, 255, .36);
      animation: esGradShift 9s ease-in-out infinite;
    }

    :deep(.van-button--default) {
      color: var(--es-ink-2);
      border: 1px solid var(--es-hair);
      background: var(--es-surface);
    }
  }
}

@keyframes esGradShift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .avatar-popup .avatar-options :deep(.van-button--primary) {
    animation: none;
  }
  .profile-header .user-avatar .camera-icon,
  .profile-actions :deep(.van-button--danger) {
    transition: none;
  }
}
</style>