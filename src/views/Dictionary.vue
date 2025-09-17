<template>
  <div class="dictionary-page">
    <!-- 头部 -->
    <div class="dictionary-header">
      <h1 class="page-title">英语词典</h1>
      <p class="page-subtitle">查找单词，学习词汇</p>
    </div>
    
    <!-- 内容区域 -->
    <div class="dictionary-content">
      <!-- 加载状态 -->
      <van-loading v-if="initialLoading" size="24px" vertical>加载中...</van-loading>
      
      <!-- 错误状态 -->
      <van-empty v-else-if="error" image="error" :description="error" />
      
      <!-- 按字母分类的单词列表 -->
      <div v-else-if="!selectedWord" class="alphabetical-word-list" ref="scrollContainer">
        
        <div v-for="currentLetter in Object.keys(wordsByLetter).filter(letter => wordsByLetter[letter] && wordsByLetter[letter].length > 0)" :key="currentLetter" class="letter-group">
          <!-- 该字母下的单词列表 -->
          <div class="letter-words">
            <!-- 字母标签 -->
            <div class="letter-tag" :id="`letter-${currentLetter}`">
              {{ currentLetter.toUpperCase() }}
            </div>
            <van-cell
              v-for="word in wordsByLetter[currentLetter]"
              :key="word.id"
              :title="word.word"
              is-link
              @click="selectWord(word.id)"
              class="word-item"
            />
            
          </div>
        </div>
        
        <!-- 加载更多状态 -->
        <div v-if="loadingMore" class="global-loading">
          <van-loading size="20px" vertical>加载更多单词...</van-loading>
        </div>
        
        <!-- 已加载完毕提示 -->
        <div v-if="!hasMoreWords && allWords.length > 0" class="load-complete">
          <van-divider>已加载全部单词</van-divider>
        </div>
      </div>
      
      <!-- 单词详情卡片 -->
      <div v-else class="word-detail">
        <van-nav-bar
          title="单词详情"
          left-text="返回"
          left-arrow
          @click-left="goBack"
        />
        
        <van-card class="word-card">
          <template #title>
            <div class="word-title">
              <h2>{{ selectedWord.word }}</h2>
            </div>
          </template>
          
          <template #desc>
            <!-- 音标和发音 -->
            <div class="phonetic-section">
              <div v-if="selectedWord.uk_phonetic" class="phonetic-item">
                <span class="phonetic-label">英式:</span>
                <span class="phonetic-text">{{ selectedWord.uk_phonetic }}</span>
                <van-button
                  v-if="selectedWord.uk_audio"
                  size="mini"
                  type="primary"
                  @click="playAudio(selectedWord.uk_audio)"
                  class="play-btn"
                >
                  🔊
                </van-button>
              </div>
              
              <div v-if="selectedWord.us_phonetic" class="phonetic-item">
                <span class="phonetic-label">美式:</span>
                <span class="phonetic-text">{{ selectedWord.us_phonetic }}</span>
                <van-button
                  v-if="selectedWord.us_audio"
                  size="mini"
                  type="primary"
                  @click="playAudio(selectedWord.us_audio)"
                  class="play-btn"
                >
                  🔊
                </van-button>
              </div>
            </div>
            
            <!-- 词性列表 -->
            <div v-if="selectedWord.pos && selectedWord.pos.length" class="pos-section">
              <h3>词性释义</h3>
              <div v-for="(pos, index) in selectedWord.pos" :key="index" class="pos-item">
                <div class="pos-header">
                  <div class="pos-type">{{ getPosName(pos.pos) }}</div>
                  <div class="pos-translation">{{ pos.translation }}</div>
                </div>
                
                <!-- 变化形式展示 -->
                <div v-if="pos.exchange && Object.keys(pos.exchange).length > 0" class="exchange-section">
                  <h4 class="exchange-title">变化形式</h4>
                  <div class="exchange-list">
                    <div v-for="(value, key) in pos.exchange" :key="key" class="exchange-item">
                      <span class="exchange-label">{{ getExchangeName(key) }}:</span>
                      <span class="exchange-value">{{ value }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 图片按钮 -->
                <div v-if="pos.picture" class="action-buttons">
                  <van-button
                    size="small"
                    type="default"
                    @click="togglePicture(index)"
                    class="toggle-btn"
                    :loading="pictureLoading[index]"
                  >
                    {{ showPictures[index] ? '隐藏图片' : '查看图片' }}
                  </van-button>
                </div>
                
                <!-- 例句展示 -->
                <div v-if="pos.example && pos.example.length" class="examples-section">
                  <h4 class="examples-title">例句</h4>
                  <div v-for="(example, exIndex) in pos.example" :key="exIndex" class="example-item">
                    <p class="example-text">{{ example.example }}</p>
                    <p class="example-translation">{{ example.translation }}</p>
                  </div>
                </div>
                
                <!-- 图片展示 -->
                <div v-if="showPictures[index] && pos.picture" class="picture-section">
                  <van-image
                    :src="getResourceUrl(pos.picture)"
                    fit="cover"
                    class="pos-picture"
                    :loading="pictureLoading[index]"
                    error-icon="photo-fail"
                  />
                </div>
                
                <!-- 图片加载错误提示 -->
                <div v-if="pictureErrors[index]" class="picture-error">
                  <van-empty image="error" description="图片加载失败" />
                </div>
              </div>
            </div>
          </template>
        </van-card>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getWordList, getWordDetail } from '@/api/dictionary'
import { getResourceUrl } from '@/utils/request'
import { showToast } from 'vant'

// 全局调试信息
console.log('🔥 Dictionary.vue 脚本开始执行', new Date().toLocaleTimeString())

export default {
  name: 'Dictionary',
  setup() {
    console.log('🎯 Dictionary setup() 函数开始执行')
    // 响应式数据
    const initialLoading = ref(true)
    const globalLoading = ref(false)
    const error = ref('')
    const selectedWord = ref(null)
    const scrollContainer = ref(null)

    // 单词列表数据
    const allWords = ref([])
    const wordsByLetter = ref({})
    const hasMoreWords = ref(true)
    const loadingMore = ref(false)
    
    // 分页配置
    const PAGE_SIZE = 200
    const currentOffset = ref(0)

    const showPictures = ref({})
    const pictureLoading = ref({})
    const pictureErrors = ref({})
    
    // 词性映射 - 根据后端数字定义
    const posChineseMap = {
      0: '未知',
      1: '名词',
      2: '及物动词',
      3: '不及物动词',
      4: '副词',
      5: '形容词',
      6: '介词',
      7: '连词',
      8: '感叹词',
      9: '助词',
      10: '代词',
      11: '数词',
      12: '冠词',
      13: '辅助动词'
    }
    
    // 词性英文缩写映射
    const posEnglishMap = {
      0: 'unknown',
      1: 'n.',
      2: 'vt.',
      3: 'vi.',
      4: 'adv.',
      5: 'adj.',
      6: 'prep.',
      7: 'conj.',
      8: 'interj.',
      9: 'part.',
      10: 'pron.',
      11: 'num.',
      12: 'art.',
      13: 'aux.'
    }
    
    // 变化形式映射 - 根据后端简称定义
    const exchangeChineseMap = {
      'p': '过去式',
      'd': '过去分词', 
      'i': '现在分词',
      '3': '第三人称单数',
      'r': '形容词比较级',
      't': '形容词最高级',
      's': '名词复数形式'
    }
    
    // 获取词性名称（中文 + 英文缩写）
    const getPosName = (pos) => {
      const chinese = posChineseMap[pos] || posChineseMap[0]
      const english = posEnglishMap[pos] || posEnglishMap[0]
      return `${chinese} (${english})`
    }
    
    // 获取变化形式名称
    const getExchangeName = (exchangeKey) => {
      return exchangeChineseMap[exchangeKey] || exchangeKey
    }
    
    // 按首字母分类单词
    const categorizeWordsByLetter = (words) => {
      const categorized = {}
      
      words.forEach(word => {
        const firstLetter = word.word.charAt(0).toLowerCase()
        if (!categorized[firstLetter]) {
          categorized[firstLetter] = []
        }
        categorized[firstLetter].push(word)
      })
      
      return categorized
    }
    
    // 加载单词列表
    const loadWords = async (append = false) => {
      console.log(`🚀 loadWords 被调用，append: ${append}, loadingMore: ${loadingMore.value}, hasMoreWords: ${hasMoreWords.value}`)
      
      if (loadingMore.value || !hasMoreWords.value) {
        console.log(`⏹️ loadWords 提前返回，loadingMore: ${loadingMore.value}, hasMoreWords: ${hasMoreWords.value}`)
        return
      }
      
      try {
        loadingMore.value = true
        console.log(`🔄 设置 loadingMore = true`)
        
        const params = {
          offset: currentOffset.value,
          limit: PAGE_SIZE,
          orderby: 'word'
        }
        
        console.log(`🔍 开始加载单词，参数:`, params)
        console.log(`📡 即将调用 getWordList API...`)
        console.log(`🌐 API Base URL: ${window.location.origin}/api`)
        
        const response = await getWordList(params)
        
        console.log(`📥 单词加载响应:`, response)
        console.log(`📊 响应数据类型:`, typeof response)
        console.log(`📊 响应数据结构:`, Object.keys(response || {}))
        
        if (response.code === 0) {
          const data = response.data || []
          const total = response.total_count || 0
          
          console.log(`✅ 单词加载成功，数据长度: ${data.length}, 总数: ${total}`)
          
          // 更新全部单词列表
          if (append) {
            allWords.value = [...allWords.value, ...data]
          } else {
            allWords.value = data
          }
          
          // 更新分页信息
          currentOffset.value += data.length
          hasMoreWords.value = currentOffset.value < total
          
          // 重新分类单词
          wordsByLetter.value = categorizeWordsByLetter(allWords.value)
          
          console.log(`📝 单词列表已更新，总数: ${allWords.value.length}`)
          console.log(`🔍 按字母分类结果:`, Object.keys(wordsByLetter.value).map(letter => `${letter}: ${wordsByLetter.value[letter].length}`).join(', '))
          
        } else {
          console.error(`❌ 加载单词失败:`, response.message)
          error.value = response.message || '加载失败'
        }
      } catch (err) {
        console.error(`💥 加载单词失败:`, err)
        error.value = '网络错误，请稍后重试'
      } finally {
        loadingMore.value = false
      }
    }
    
    // 加载更多单词（用于懒加载）
    const loadMoreWords = async () => {
      if (!hasMoreWords.value || loadingMore.value) return
      await loadWords(true)
    }
    
    // 初始化加载
    const initializeWordList = async () => {
      console.log('🎯 initializeWordList 函数开始执行')
      
      try {
        initialLoading.value = true
        console.log('🔄 设置 initialLoading = true')
        
        console.log('🔧 开始初始化单词列表...')
        
        // 重置状态
        allWords.value = []
        wordsByLetter.value = {}
        currentOffset.value = 0
        hasMoreWords.value = true
        
        console.log('🔄 状态已重置，开始加载第一批单词...')
        
        // 加载第一批单词
        await loadWords()
        
        console.log('✅ 第一批单词加载完成，设置滚动监听...')
        
        // 设置滚动监听
        await nextTick()
        setupScrollListener()
        
        console.log('✅ 滚动监听设置完成')
        
      } catch (err) {
        console.error('💥 初始化单词列表失败:', err)
        error.value = '网络错误，请稍后重试: ' + err.message
      } finally {
        initialLoading.value = false
        console.log('🔄 设置 initialLoading = false')
      }
    }
    
    // 设置滚动监听
    const setupScrollListener = () => {
      if (!scrollContainer.value) return
      
      const handleScroll = () => {
        const container = scrollContainer.value
        const scrollTop = container.scrollTop
        const scrollHeight = container.scrollHeight
        const clientHeight = container.clientHeight
        
        // 计算滚动进度
        const scrollProgress = (scrollTop + clientHeight) / scrollHeight
        
        // 当滚动到80%时开始加载更多
        if (scrollProgress > 0.8 && hasMoreWords.value && !loadingMore.value) {
          loadMoreWords()
        }
      }
      
      scrollContainer.value.addEventListener('scroll', handleScroll)
    }
    

    
    // 选择单词
    const selectWord = async (wordId) => {
      try {
        initialLoading.value = true
        const response = await getWordDetail(wordId)
        
        if (response.code === 0) {
          selectedWord.value = response.data
          // 重置展开状态
          showPictures.value = {}
        } else {
          showToast(response.message || '获取单词详情失败')
        }
      } catch (err) {
        console.error('获取单词详情失败:', err)
        showToast('网络错误，请稍后重试')
      } finally {
        initialLoading.value = false
      }
    }
    
    // 返回列表
    const goBack = () => {
      selectedWord.value = null
    }
    

    
    // 切换图片显示
    const togglePicture = async (index) => {
      // 如果要隐藏图片，直接切换状态
      if (showPictures.value[index]) {
        showPictures.value[index] = false
        return
      }
      
      // 如果要显示图片，先发起请求验证图片是否可用
      const pos = selectedWord.value.pos[index]
      if (!pos.picture) return
      
      try {
        pictureLoading.value[index] = true
        pictureErrors.value[index] = false
        
        // 创建图片对象来预加载图片
        const img = new Image()
        const imageUrl = getResourceUrl(pos.picture)
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = imageUrl
        })
        
        // 图片加载成功，显示图片
        showPictures.value[index] = true
        
      } catch (err) {
        console.error('图片加载失败:', err)
        pictureErrors.value[index] = true
        showToast('图片加载失败')
      } finally {
        pictureLoading.value[index] = false
      }
    }
    
    // 播放音频
    const playAudio = (audioUrl) => {
      try {
        const audio = new Audio(getResourceUrl(audioUrl))
        audio.play().catch(err => {
          console.error('音频播放失败:', err)
          showToast('音频播放失败')
        })
      } catch (err) {
        console.error('音频播放失败:', err)
        showToast('音频播放失败')
      }
    }
    

    
    // 初始化
    onMounted(async () => {
      console.log('🚀 Dictionary 组件已挂载，开始初始化...')
      console.log('🕐 当前时间戳:', Date.now())
      console.log('📊 初始 wordsByLetter 状态:', JSON.stringify(wordsByLetter.value))
      console.log('🔧 开始调用 initializeWordList...')
      
      try {
        await initializeWordList()
        console.log('✅ initializeWordList 调用完成')
      } catch (err) {
        console.error('❌ initializeWordList 调用失败:', err)
        error.value = '初始化失败: ' + err.message
      }
    })
    
    return {
      // 基础状态
      initialLoading,
      error,
      selectedWord,
      scrollContainer,
      
      // 单词数据
      allWords,
      wordsByLetter,
      hasMoreWords,
      loadingMore,
      currentOffset,
      
      // 图片相关
      showPictures,
      pictureLoading,
      pictureErrors,
      
      // 方法
      getPosName,
      getExchangeName,
      selectWord,
      goBack,
      togglePicture,
      playAudio,
      loadMoreWords,
      
      // 工具方法
      getResourceUrl
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
  max-width: 800px;
  margin: 0 auto;
}

/* 按字母分类的单词列表样式 */
.alphabetical-word-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding-bottom: 20px;
}

/* 字母组样式 */
.letter-group {
  margin-bottom: 20px;
  position: relative;
}

/* 字母标签样式 - 通讯录风格 */
.letter-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #1989fa;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(25, 137, 250, 0.3);
}

/* 字母下的单词列表 */
.letter-words {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
  padding-top: 8px;
  position: relative;
}

.word-item {
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.2s ease;
  margin-left: 48px;
}

.word-item:hover {
  background-color: #f8f9fa;
}

.word-item:last-child {
  border-bottom: none;
}

/* 加载状态样式 */
.letter-loading {
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.global-loading {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

/* 无单词提示 */
.no-words {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 2px dashed #e0e0e0;
}

.no-words-text {
  color: #999;
  font-size: 14px;
}

/* 单词详情样式 */
.word-detail {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.word-card {
  padding: 20px;
}

.word-title h2 {
  color: #333;
  font-size: 32px;
  font-weight: bold;
  margin: 0;
  text-align: center;
}

/* 音标部分样式 */
.phonetic-section {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
}

.phonetic-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.phonetic-item:last-child {
  margin-bottom: 0;
}

.phonetic-label {
  font-weight: bold;
  color: #666;
  min-width: 50px;
}

.phonetic-text {
  font-family: 'Times New Roman', serif;
  font-size: 18px;
  color: #1989fa;
  font-weight: bold;
}

.play-btn {
  min-width: 40px;
  height: 32px;
}

/* 词性部分样式 */
.pos-section {
  margin-top: 20px;
}

.pos-section h3 {
  color: #333;
  font-size: 20px;
  margin-bottom: 15px;
  border-bottom: 2px solid #1989fa;
  padding-bottom: 5px;
}

.pos-item {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #1989fa;
}

.pos-header {
  margin-bottom: 10px;
}

.pos-header .pos-type {
  margin-bottom: 8px;
}

.pos-header .pos-translation {
  margin-left: 0;
}

.pos-type {
  background: #1989fa;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
}

.pos-translation {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

/* 变化形式样式 */
.exchange-section {
  margin-top: 15px;
  background: white;
  border-radius: 8px;
  padding: 15px;
}

.exchange-title {
  color: #333;
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 10px 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.exchange-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.exchange-item {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
}

.exchange-label {
  color: #0369a1;
  font-weight: 500;
  margin-right: 4px;
}

.exchange-value {
  color: #1e40af;
  font-weight: bold;
}

.action-buttons {
  margin: 10px 0;
}

.toggle-btn {
  margin-right: 10px;
}

/* 例句样式 */
.examples-section {
  margin-top: 15px;
  background: white;
  border-radius: 8px;
  padding: 15px;
}

.examples-title {
  color: #333;
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 10px 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.example-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.example-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.example-text {
  font-style: italic;
  color: #333;
  margin-bottom: 5px;
  line-height: 1.6;
}

.example-translation {
  color: #666;
  font-size: 14px;
  margin: 0;
}

/* 图片样式 */
.picture-section {
  margin-top: 15px;
  text-align: center;
}

.pos-picture {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-top: 8px;
}

.picture-error {
  margin-top: 8px;
  padding: 16px;
  text-align: center;
  background-color: #f7f8fa;
  border-radius: 8px;
}

/* 加载和错误状态样式 */
.van-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.van-empty {
  background: white;
  border-radius: 16px;
  padding: 40px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}


</style>