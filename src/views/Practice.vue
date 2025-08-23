<template>
  <div class="practice-page">
    <!-- 头部 -->
    <div class="practice-header">
      <h1 class="page-title">英语练习</h1>
      <p class="page-subtitle">提升你的英语水平</p>
    </div>
    
    <!-- 内容区域 -->
    <div class="practice-content">
      <div class="coming-soon">
        <div class="icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="35" stroke="#1989fa" stroke-width="3" fill="none"/>
            <path d="M25 40L35 50L55 30" stroke="#1989fa" stroke-width="3" fill="none"/>
          </svg>
        </div>
        <h2>功能开发中</h2>
        <p>练习功能正在紧张开发中，敬请期待！</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Practice'
}
</script>

<style lang="scss" scoped>
.practice-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.practice-header {
  background: linear-gradient(135deg, #1989fa 0%, #1976d2 100%);
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

.practice-content {
  padding: 40px 20px;
  
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
</style>