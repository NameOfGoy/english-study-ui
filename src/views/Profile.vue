<template>
  <div class="profile-page" 
       @touchstart="handleTouchStart" 
       @touchmove="handleTouchMove" 
       @touchend="handleTouchEnd">
    <!-- 头部信息 -->
    <div class="profile-header">
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
        <p class="user-id">ID: {{ userInfo.id }}</p>
      </div>
    </div>
    
    <!-- 用户信息列表 -->
    <div class="profile-content">
      <van-cell-group>
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
      </van-cell-group>
      
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
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getUserInfo, updateUserInfo, updateUserAvatar } from '@/api/user'
import { getUserInfo as getLocalUserInfo, setUserInfo, clearAllData } from '@/utils/auth'
import { getResourceUrl } from '@/utils/request'

export default {
  name: 'Profile',
  setup() {
    const router = useRouter()
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
    
    onMounted(() => {
      loadUserInfo()
    })
    
    return {
      userInfo,
      showEditPopup,
      showAvatarPopup,
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
  background-color: #f8f9fa;
  padding-bottom: 80px;
  position: relative;
  overflow-x: hidden;
}

.profile-header {
  background: linear-gradient(135deg, #1989fa 0%, #1976d2 100%);
  padding: 40px 20px 30px;
  text-align: center;
  color: white;
  position: relative;
  
  .user-avatar {
    position: relative;
    display: inline-block;
    margin-bottom: 16px;
    
    .avatar-placeholder {
      width: 80px;
      height: 80px;
      background-color: #f0f0f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ccc;
    }
    
    .camera-icon {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 28px;
      height: 28px;
      background-color: #1989fa;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      border: 2px solid white;
      cursor: pointer;
    }
  }
  
  .user-basic-info {
    .username {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .user-id {
      font-size: 14px;
      opacity: 0.8;
    }
  }
}

.profile-content {
  padding: 20px;
  
  :deep(.van-cell-group) {
    margin-bottom: 20px;
    border-radius: 8px;
    overflow: hidden;
  }
  
  :deep(.van-cell) {
    padding: 16px;
    
    .van-cell__title {
      font-weight: 500;
    }
  }
}

.profile-actions {
  margin-top: 40px;
  
  :deep(.van-button) {
    height: 48px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 500;
  }
}

.edit-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #ebedf0;
    
    h3 {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
    }
  }
  
  .popup-content {
    flex: 1;
    padding: 20px;
    
    :deep(.van-field) {
      background-color: #f8f9fa;
      border-radius: 8px;
    }
  }
}

.avatar-popup {
  padding: 20px;
  
  .popup-header {
    text-align: center;
    margin-bottom: 20px;
    
    h3 {
      font-size: 18px;
      font-weight: 500;
      margin: 0;
    }
  }
  
  .avatar-options {
    :deep(.van-button) {
      margin-bottom: 12px;
      height: 48px;
      border-radius: 24px;
      font-size: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>