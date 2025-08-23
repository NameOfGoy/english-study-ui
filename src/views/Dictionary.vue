<template>
  <div class="dictionary-page">
    <!-- 头部 -->
    <div class="dictionary-header">
      <h1 class="page-title">英语词典</h1>
      <p class="page-subtitle">查找单词，学习词汇</p>
    </div>
    
    <!-- 内容区域 -->
    <div class="dictionary-content">
      <div class="feature-section">
        <h2>音标工具</h2>
        <p>输入音标字符串，查看IPA字符集展示</p>
        <van-button 
          type="primary" 
          size="large" 
          @click="showPhoneticInput"
          class="phonetic-btn"
        >
          输入音标
        </van-button>
      </div>
      
      <div class="coming-soon">
        <div class="icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="15" y="20" width="50" height="40" rx="4" stroke="#1989fa" stroke-width="3" fill="none"/>
            <path d="M25 30H55" stroke="#1989fa" stroke-width="2"/>
            <path d="M25 38H50" stroke="#1989fa" stroke-width="2"/>
            <path d="M25 46H45" stroke="#1989fa" stroke-width="2"/>
            <circle cx="60" cy="25" r="8" stroke="#1989fa" stroke-width="2" fill="none"/>
            <path d="M66 31L72 37" stroke="#1989fa" stroke-width="2"/>
          </svg>
        </div>
        <h2>更多功能开发中</h2>
        <p>词典功能正在紧张开发中，敬请期待！</p>
      </div>
    </div>
    
    <!-- 音标输入弹窗 -->
    <van-popup 
      v-model:show="showInputPopup" 
      position="center" 
      :style="{ padding: '20px', borderRadius: '12px' }"
    >
      <div class="phonetic-input-popup">
        <h3>输入音标</h3>
        <van-field
          v-model="phoneticInput"
          placeholder="请输入音标字符串"
          :border="false"
          class="input-field"
        />
        <div class="popup-buttons">
          <van-button @click="cancelInput" size="large">取消</van-button>
          <van-button type="primary" @click="confirmInput" size="large">确定</van-button>
        </div>
      </div>
    </van-popup>
    
    <!-- IPA展示弹窗 -->
    <van-popup 
      v-model:show="showIPAPopup" 
      position="center" 
      :style="{ padding: '20px', borderRadius: '12px', maxWidth: '90vw' }"
    >
      <div class="ipa-display-popup">
        <h3>IPA音标展示</h3>
        <div class="ipa-content">
          <div class="ipa-text">{{ displayPhonetic }}</div>
        </div>
        <van-button type="primary" @click="closeIPADisplay" size="large" block>
          关闭
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Dictionary',
  setup() {
    const showInputPopup = ref(false)
    const showIPAPopup = ref(false)
    const phoneticInput = ref('')
    const displayPhonetic = ref('')
    
    // 显示音标输入弹窗
    const showPhoneticInput = () => {
      phoneticInput.value = ''
      showInputPopup.value = true
    }
    
    // 取消输入
    const cancelInput = () => {
      showInputPopup.value = false
      phoneticInput.value = ''
    }
    
    // 确认输入
    const confirmInput = () => {
      if (phoneticInput.value.trim()) {
        displayPhonetic.value = phoneticInput.value.trim()
        showInputPopup.value = false
        showIPAPopup.value = true
      }
    }
    
    // 关闭IPA展示
    const closeIPADisplay = () => {
      showIPAPopup.value = false
    }
    
    return {
      showInputPopup,
      showIPAPopup,
      phoneticInput,
      displayPhonetic,
      showPhoneticInput,
      cancelInput,
      confirmInput,
      closeIPADisplay
    }
  }
}
</script>

<style lang="scss" scoped>
.dictionary-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.dictionary-header {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  padding: 40px 20px 30px;
  text-align: center;
  color: white;
  
  .page-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  
  .page-subtitle {
    font-size: 14px;
    opacity: 0.9;
  }
}

.dictionary-content {
  padding: 40px 20px;
  
  .feature-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
    
    h2 {
      font-size: 20px;
      color: #323233;
      margin-bottom: 8px;
    }
    
    p {
      font-size: 14px;
      color: #646566;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    
    .phonetic-btn {
      width: 200px;
      height: 44px;
      border-radius: 22px;
    }
  }
  
  .coming-soon {
    text-align: center;
    padding: 60px 20px;
    
    .icon {
      margin-bottom: 24px;
    }
    
    h2 {
      font-size: 20px;
      color: #323233;
      margin-bottom: 12px;
    }
    
    p {
      font-size: 14px;
      color: #646566;
      line-height: 1.5;
    }
  }
}

// 弹窗样式
.phonetic-input-popup {
  width: 280px;
  text-align: center;
  
  h3 {
    font-size: 18px;
    color: #323233;
    margin-bottom: 20px;
  }
  
  .input-field {
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 20px;
    
    :deep(.van-field__control) {
      font-size: 16px;
      padding: 12px;
    }
  }
  
  .popup-buttons {
    display: flex;
    gap: 12px;
    
    .van-button {
      flex: 1;
      height: 44px;
      border-radius: 8px;
    }
  }
}

.ipa-display-popup {
  width: 320px;
  text-align: center;
  
  h3 {
    font-size: 18px;
    color: #323233;
    margin-bottom: 20px;
  }
  
  .ipa-content {
    background-color: #f8f9fa;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    
    .ipa-text {
      font-family: 'Times New Roman', 'Doulos SIL', 'Charis SIL', serif;
      font-size: 24px;
      line-height: 1.6;
      color: #1989fa;
      word-break: break-all;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .van-button {
    height: 44px;
    border-radius: 8px;
  }
}
</style>