<template>
  <div class="dictionary-page" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <!-- 头部 -->
    <div class="dictionary-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">英语词典</h1>
          <p class="page-subtitle">查找单词，学习词汇</p>
        </div>
        <!-- 显示模式切换栏 -->
        <div class="display-mode-switcher">
          <div 
            v-for="mode in displayModes" 
            :key="mode.value"
            class="mode-option"
            :class="{ active: currentDisplayMode === mode.value }"
            @click="switchDisplayMode(mode.value)"
          >
            {{ mode.label }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="dictionary-content">
      <!-- 加载状态 -->
      <van-loading v-if="initialLoading" size="24px" vertical>加载中...</van-loading>
      
      <!-- 错误状态 -->
      <van-empty v-else-if="error" image="error" :description="error" />
      
      <!-- 页面切换动画容器 -->
      <transition :name="transitionName" mode="out-in" @after-enter="handleAfterEnter">
        <!-- 按字母分类的单词列表 -->
        <div v-if="!selectedWord" key="word-list" class="alphabetical-word-list" ref="scrollContainer">
        
        <div v-for="currentLetter in Object.keys(wordsByLetter).filter(letter => wordsByLetter[letter] && wordsByLetter[letter].length > 0)" :key="currentLetter" class="letter-group">
          <!-- 该字母下的单词列表 -->
          <div class="letter-words">
            <!-- 字母标签 -->
            <div class="letter-tag" :id="`letter-${currentLetter}`">
              {{ currentLetter.toUpperCase() }}
            </div>
            <!-- 单词模式 -->
            <van-cell
              v-if="currentDisplayMode === 'word'"
              v-for="word in wordsByLetter[currentLetter]"
              :key="word.id"
              :title="word.word"
              is-link
              @click="selectWord(word.id)"
              class="word-item"
            />
            
            <!-- 状态模式调试信息已移除 -->
            
            <!-- 状态模式 -->
            <van-cell
              v-if="currentDisplayMode === 'status'"
              v-for="word in getFilteredWordsForStatus(currentLetter)"
              :key="word.id"
              :title="word.word"
              @click="openStatusModal(word)"
              class="word-item status-mode clickable"
            >
              <template #value>
                <div class="status-indicator" :class="getStatusClass(word.status)" v-if="word.status > 0">
                  <span class="status-dot"></span>
                  <span class="status-text">{{ getStatusText(word.status) }}</span>
                </div>
              </template>
            </van-cell>
            
            <!-- 标签模式 -->
            <van-cell
              v-else-if="currentDisplayMode === 'tag'"
              v-for="word in (tagWords.length > 0 ? tagWords.filter(w => w.word.charAt(0).toLowerCase() === currentLetter) : wordsByLetter[currentLetter])"
              :key="word.id"
              :title="word.word"
              is-link
              @click="openTagModal(word)"
              class="word-item tag-mode"
            >
              <template #label>
                <div class="word-tags">
                  <span 
                    v-for="tag in word.tags || []" 
                    :key="tag.id"
                    class="tag-item"
                    :style="{ backgroundColor: tag.color }"
                  >
                    {{ tag.name }}
                  </span>
                  <span v-if="!word.tags || word.tags.length === 0" class="no-tags">暂无标签</span>
                </div>
              </template>
            </van-cell>
            
          </div>
        </div>
        
        <!-- 加载更多状态 -->
        <div v-if="loadingMore" class="global-loading">
          <van-loading size="20px" vertical>加载更多单词...</van-loading>
        </div>
        
        <!-- 状态数据加载状态 -->
        <div v-if="loadingStatusData && currentDisplayMode === 'status'" class="global-loading">
          <van-loading size="20px" vertical>加载状态数据...</van-loading>
        </div>
        
        <!-- 标签数据加载状态 -->
        <div v-if="loadingTagData && currentDisplayMode === 'tag'" class="global-loading">
          <van-loading size="20px" vertical>加载标签数据...</van-loading>
        </div>
        
          <!-- 已加载完毕提示 -->
          <div v-if="!hasMoreWords && allWords.length > 0" class="load-complete">
            <van-divider>已加载全部单词</van-divider>
          </div>
        </div>
        
        <!-- 单词详情卡片 -->
        <div v-else key="word-detail" class="word-detail">
        <!-- 自定义美化导航栏 -->
        <div class="custom-nav-bar">
          <div class="nav-left" @click="goBack">
            <div class="back-btn">
              <svg class="back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="back-text">返回</span>
            </div>
          </div>
          <div class="nav-center">
            <h1 class="nav-title">单词详情</h1>
            <div class="nav-subtitle">Word Details</div>
          </div>
          <div class="nav-right">
            <!-- 可以添加其他操作按钮 -->
          </div>
        </div>
        
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
                <div v-if="selectedWord.uk_audio" class="audio-btn-container">
                  <van-button
                    size="mini"
                    type="default"
                    @click="playAudio(selectedWord.uk_audio, 'uk')"
                    class="play-btn"
                    :class="{ 'playing': audioPlaying['uk'] }"
                  >
                    🔊
                  </van-button>
                  <div v-if="audioPlaying['uk']" class="sound-waves">
                    <div class="wave wave-1"></div>
                    <div class="wave wave-2"></div>
                    <div class="wave wave-3"></div>
                  </div>
                </div>
              </div>
              
              <div v-if="selectedWord.us_phonetic" class="phonetic-item">
                <span class="phonetic-label">美式:</span>
                <span class="phonetic-text">{{ selectedWord.us_phonetic }}</span>
                <div v-if="selectedWord.us_audio" class="audio-btn-container">
                  <van-button
                    size="mini"
                    type="default"
                    @click="playAudio(selectedWord.us_audio, 'us')"
                    class="play-btn"
                    :class="{ 'playing': audioPlaying['us'] }"
                  >
                    🔊
                  </van-button>
                  <div v-if="audioPlaying['us']" class="sound-waves">
                    <div class="wave wave-1"></div>
                    <div class="wave wave-2"></div>
                    <div class="wave wave-3"></div>
                  </div>
                </div>
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
                
                <!-- 例句展示 -->
                <div v-if="pos.example && pos.example.length" class="examples-section">
                  <h4 class="examples-title">例句</h4>
                  <div v-for="(example, exIndex) in pos.example" :key="exIndex" class="example-item">
                    <p class="example-text">{{ example.example }}</p>
                    <p class="example-translation">{{ example.translation }}</p>
                  </div>
                </div>
                
                <!-- 图片按钮 -->
                <div class="picture-action">
                  <van-button
                    size="small"
                    type="primary"
                    plain
                    @click="openPictureModal(index)"
                    class="picture-toggle-btn"
                    icon="photo-o"
                  >
                    查看图片
                  </van-button>
                </div>
              </div>
            </div>
          </template>
        </van-card>
        </div>
      </transition>
    </div>
    
    <!-- 图片查看弹窗 -->
    <van-popup
      v-model:show="showPictureModal"
      position="center"
      :style="{ width: '90%', maxWidth: '400px', borderRadius: '12px' }"
    >
      <div class="picture-modal">
        <div class="modal-header">
          <h3>词性图片</h3>
          <van-icon name="cross" @click="closePictureModal" class="close-btn" />
        </div>
        
        <div class="modal-content">
          <!-- 当前图片展示 -->
          <div v-if="currentPicture" class="current-picture">
            <van-image
              :src="getResourceUrl(currentPicture)"
              fit="cover"
              class="modal-picture"
              error-icon="photo-fail"
            />
          </div>
          
          <!-- 无图片提示 -->
          <div v-else class="no-picture">
            <van-empty image="search" description="未配置图片" />
          </div>
        </div>
        
        <div class="modal-actions">
          <van-button
            type="primary"
            @click="generatePicture"
            :loading="generatingPicture"
            class="action-btn"
          >
            生成图片
          </van-button>
          <van-button
            type="primary"
            plain
            @click="openImageUpload"
            :loading="uploadingImage"
            class="action-btn upload-btn"
            icon="photograph"
          >
            上传图片
          </van-button>
        </div>
      </div>
    </van-popup>
    
    <!-- 图片裁剪弹窗 -->
    <van-popup
      v-model:show="showCropModal"
      position="center"
      :style="{ width: '95%', maxWidth: '450px', borderRadius: '12px' }"
      :close-on-click-overlay="false"
    >
      <div class="crop-modal">
        <div class="modal-header">
          <h3>裁剪图片</h3>
          <van-icon name="cross" @click="closeCropModal" class="close-btn" />
        </div>
        
        <div class="modal-content">
          <div class="crop-container">
            <VueCropper
              v-if="selectedImageFile"
              ref="cropper"
              :img="selectedImageSrc"
              :outputSize="1"
              :outputType="'png'"
              :info="true"
              :full="false"
              :fixed="true"
              :fixedNumber="[1, 1]"
              :canMove="true"
              :canMoveBox="true"
              :fixedBox="false"
              :original="false"
              :autoCrop="true"
              :autoCropWidth="300"
              :autoCropHeight="300"
              :centerBox="true"
              :high="true"
              class="cropper-component"
            />
          </div>
        </div>
        
        <div class="modal-actions">
          <van-button
            type="default"
            @click="closeCropModal"
            class="action-btn cancel-btn"
          >
            取消
          </van-button>
          <van-button
            type="primary"
            @click="confirmCrop"
            :loading="uploadingImage"
            class="action-btn confirm-btn"
          >
            确认裁剪并上传
          </van-button>
        </div>
      </div>
    </van-popup>
    
    <!-- 小型弹出提示 -->
    <div v-if="showActionModal" class="action-tooltip" @click.self="restorePicture">
      <div class="tooltip-content">
        <div class="tooltip-buttons">
          <van-button
            type="primary"
            size="small"
            @click="applyPicture"
            :loading="applyingPicture"
            class="tooltip-btn"
          >
            应用
          </van-button>
          <van-button
            type="default"
            size="small"
            @click="restorePicture"
            class="tooltip-btn"
          >
            恢复
          </van-button>
        </div>
      </div>
    </div>
    
    <!-- 添加单词浮动按钮 -->
    <div v-if="!selectedWord && currentDisplayMode === 'word'" class="add-word-fab" @click="openAddWordModal">
      <van-icon name="plus" size="24" />
    </div>
    
    <!-- 添加单词弹窗 -->
    <van-popup
      v-model:show="showAddWordModal"
      position="center"
      :style="{ width: '90%', maxWidth: '400px', borderRadius: '16px' }"
      :close-on-click-overlay="false"
    >
      <div class="add-word-modal">
        <div class="modal-header">
          <h3>添加新单词</h3>
          <van-icon name="cross" @click="closeAddWordModal" class="close-btn" />
        </div>
        
        <div class="modal-content">
          <van-form @submit="submitAddWord">
            <van-field
              v-model="addWordForm.word"
              name="word"
              label="单词"
              placeholder="请输入英文单词"
              :rules="[{ required: true, message: '请输入单词' }]"
              clearable
              @input="handleWordInput"
              @keydown="handleWordKeydown"
            />
            
            <van-field name="generatePicture" label="生成图片">
              <template #input>
                <van-checkbox v-model="addWordForm.isGeneratePicture">自动生成图片</van-checkbox>
              </template>
            </van-field>
            
            <div class="modal-actions">
              <van-button
                type="default"
                @click="closeAddWordModal"
                class="action-btn cancel-btn"
              >
                取消
              </van-button>
              <van-button
                type="primary"
                native-type="submit"
                :loading="addingWord"
                :disabled="addingWord"
                class="action-btn submit-btn"
              >
                添加
              </van-button>
            </div>
          </van-form>
        </div>
      </div>
    </van-popup>
    
    <!-- 状态编辑弹窗 -->
    <van-popup
      v-model:show="showStatusModal"
      position="center"
      :style="{ width: '90%', maxWidth: '400px', borderRadius: '16px' }"
      :close-on-click-overlay="false"
    >
      <div class="status-modal">
        <div class="modal-header">
          <h3>编辑单词状态</h3>
          <van-icon name="cross" @click="closeStatusModal" class="close-btn" />
        </div>
        
        <div class="modal-content">
          <div class="word-info">
            <h4>{{ currentEditWord?.word }}</h4>
          </div>
          
          <van-form @submit="submitStatusUpdate">
            <van-field name="status" label="单词状态">
              <template #input>
                <van-radio-group v-model="statusForm.status" direction="vertical">
                  <van-radio name="1" class="status-radio">
                    <template #icon="props">
                      <div class="radio-icon" :class="{ checked: props.checked }">
                        <span class="status-dot study"></span>
                      </div>
                    </template>
                    学习
                  </van-radio>
                  <van-radio name="2" class="status-radio">
                    <template #icon="props">
                      <div class="radio-icon" :class="{ checked: props.checked }">
                        <span class="status-dot review"></span>
                      </div>
                    </template>
                    复习
                  </van-radio>
                  <van-radio name="3" class="status-radio">
                    <template #icon="props">
                      <div class="radio-icon" :class="{ checked: props.checked }">
                        <span class="status-dot strengthen"></span>
                      </div>
                    </template>
                    强化
                  </van-radio>
                  <van-radio name="4" class="status-radio">
                    <template #icon="props">
                      <div class="radio-icon" :class="{ checked: props.checked }">
                        <span class="status-dot finish"></span>
                      </div>
                    </template>
                    完成
                  </van-radio>
                </van-radio-group>
              </template>
            </van-field>
            
            <div class="modal-actions">
              <van-button
                type="default"
                @click="closeStatusModal"
                class="action-btn cancel-btn"
              >
                取消
              </van-button>
              <van-button
                type="primary"
                native-type="submit"
                :loading="updatingStatus"
                :disabled="updatingStatus"
                class="action-btn submit-btn"
              >
                保存
              </van-button>
            </div>
          </van-form>
        </div>
      </div>
    </van-popup>
    
    <!-- 标签编辑弹窗 -->
    <van-popup
      v-model:show="showTagModal"
      position="center"
      :style="{ width: '90%', maxWidth: '400px', borderRadius: '16px' }"
      :close-on-click-overlay="false"
    >
      <div class="tag-modal">
        <div class="modal-header">
          <h3>编辑单词标签</h3>
          <van-icon name="cross" @click="closeTagModal" class="close-btn" />
        </div>
        
        <div class="modal-content">
          <div class="word-info">
            <h4>{{ currentEditWord?.word }}</h4>
            <p class="word-subtitle">Word Tags</p>
          </div>
          
          <!-- 当前标签 -->
          <div class="current-tags-section">
            <h5>当前标签</h5>
            <div class="current-tags">
              <span 
                v-for="tag in tagForm.selectedTags" 
                :key="tag.id"
                class="tag-item current"
                :style="{ backgroundColor: tag.color }"
                @click="removeTag(tag.id)"
              >
                {{ tag.name }}
                <van-icon name="cross" class="remove-icon" />
              </span>
              <span v-if="tagForm.selectedTags.length === 0" class="no-tags">暂无标签</span>
            </div>
          </div>
          
          <!-- 预设标签 -->
          <div class="preset-tags-section">
            <h5>选择标签</h5>
            <div class="preset-tags">
              <span
                v-for="tag in availableTags" 
                :key="tag.id"
                class="tag-item preset"
                :class="{ selected: isTagSelected(tag.id) }"
                :style="{ backgroundColor: tag.color }"
                @click="toggleTag(tag)"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
          
          <div class="modal-actions">
            <van-button
              type="default"
              @click="closeTagModal"
              class="action-btn cancel-btn"
            >
              取消
            </van-button>
            <van-button
              type="primary"
              @click="submitTagUpdate"
              :loading="updatingTags"
              :disabled="updatingTags"
              class="action-btn submit-btn"
            >
              保存
            </van-button>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getWordList, getWordDetail, generateWordPicture, updateWordPicture, addWord, getWordStatusList, updateWordStatus, getWordTagList, updateWordTag } from '@/api/dictionary'
import { getTagList, addTag, updateTag } from '@/api/tag'
import { uploadFile } from '@/api/file'
import { getUserInfo, getUserId } from '@/utils/auth'
import { getResourceUrl } from '@/utils/request'
import { showToast } from 'vant'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

// 全局调试信息
console.log('🔥 Dictionary.vue 脚本开始执行', new Date().toLocaleTimeString())

export default {
  name: 'Dictionary',
  components: {
    VueCropper
  },
  setup() {
    console.log('🎯 Dictionary setup() 函数开始执行')
    // 路由
    const router = useRouter()
    
    // 响应式数据
    const initialLoading = ref(true)
    const globalLoading = ref(false)
    const error = ref('')
    const selectedWord = ref(null)
    const scrollContainer = ref(null)
    const lastScrollTop = ref(0)
    const transitionName = ref('page-slide')
    
    // 显示模式切换相关
    const currentDisplayMode = ref('word')
    const displayModes = [
      { label: '单词', value: 'word' },
      { label: '状态', value: 'status' },
      { label: '标签', value: 'tag' }
    ]
    
    // 状态编辑弹窗相关
    const showStatusModal = ref(false)
    const currentEditWord = ref(null)
    const updatingStatus = ref(false)
    const statusForm = reactive({
      status: '0'
    })
    
    // 标签编辑弹窗相关
    const showTagModal = ref(false)
    const updatingTags = ref(false)
    const tagForm = reactive({
      selectedTags: []
    })
    
    // 预设标签数据（模拟数据）
    const presetTags = ref([
      { id: 1, name: '重点词汇', color: '#ff6b6b' },
      { id: 2, name: '高频词', color: '#4ecdc4' },
      { id: 3, name: '易错词', color: '#45b7d1' },
      { id: 4, name: '考试词汇', color: '#96ceb4' },
      { id: 5, name: '日常用词', color: '#feca57' },
      { id: 6, name: '专业词汇', color: '#ff9ff3' },
      { id: 7, name: '口语词汇', color: '#54a0ff' },
      { id: 8, name: '写作词汇', color: '#5f27cd' }
    ])

    // 单词列表数据
    const allWords = ref([])
    const wordsByLetter = ref({})
    const hasMoreWords = ref(true)
    const loadingMore = ref(false)
    
    // 状态和标签数据
    const statusWords = ref([])
    const tagWords = ref([])
    const availableTags = ref([])
    const loadingStatusData = ref(false)
    const loadingTagData = ref(false)
    
    // 分页配置
    const PAGE_SIZE = 200
    const currentOffset = ref(0)

    const showPictures = ref({})
  const pictureLoading = ref({})
  const pictureErrors = ref({})
  
  // 图片弹窗相关
    const showPictureModal = ref(false)
    const showActionModal = ref(false)
    const currentPicture = ref('')
    const generatedPicture = ref('')
    const generatingPicture = ref(false)
    const applyingPicture = ref(false)
    const currentPosIndex = ref(-1)
    const originalPicture = ref('')
    
    // 添加单词相关
    const showAddWordModal = ref(false)
    const addingWord = ref(false)
    const addWordForm = reactive({
      word: '',
      isGeneratePicture: false
    })
    
    // 图片上传相关
    const showCropModal = ref(false)
    const selectedImageFile = ref(null)
    const selectedImageSrc = ref('')
    const uploadingImage = ref(false)
    const cropper = ref(null)
    const uploadedImagePath = ref('')
    

    
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
    
    // 生成随机标签（模拟数据）
    const generateRandomTags = () => {
      // 如果有真实标签数据，使用真实数据，否则使用预设数据
      const tagsToUse = availableTags.value.length > 0 ? availableTags.value : presetTags.value
      const tagCount = Math.floor(Math.random() * 3) + 1 // 1-3个标签
      const shuffled = [...tagsToUse].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, tagCount)
    }
    
    // 获取状态显示文本
    const getStatusText = (status) => {
      const statusMap = {
        0: '未知',
        1: '学习', 
        2: '复习',
        3: '强化',
        4: '完成'
      }
      return statusMap[status] || '未知'
    }
    
    // 获取状态颜色类
    const getStatusClass = (status) => {
      const classMap = {
        0: 'unknown',
        1: 'study',
        2: 'review',
        3: 'strengthen',
        4: 'finish'
      }
      return classMap[status] || 'unknown'
    }
    
    // 获取状态模式下的单词列表：展示全部，将有状态的排前面
    const getFilteredWordsForStatus = (letter) => {
      const wordsForLetter = wordsByLetter.value[letter] || []

      // 将状态>0的排在前面，其余保持原顺序
      const withStatus = []
      const withoutStatus = []
      for (const w of wordsForLetter) {
        if (Number(w.status) > 0) withStatus.push(w)
        else withoutStatus.push(w)
      }

      const result = [...withStatus, ...withoutStatus]

      console.log(`✅ 状态模式 - 字母 ${letter} 列表:`, {
        总数: result.length,
        排前的有状态数: withStatus.length
      })
      return result
    }
    
    // 加载状态数据
    const loadStatusData = async () => {
      try {
        loadingStatusData.value = true
        
        // 如果已有单词数据，根据单词ID加载状态
        if (allWords.value.length > 0) {
          const wordIds = allWords.value.map(word => word.id)
          console.log('🔍 准备加载状态数据，单词ID列表:', wordIds.slice(0, 5), '...(共', wordIds.length, '个)')
          const response = await getWordStatusList(wordIds)
          if (response.code === 0) {
            statusWords.value = response.data || []
            console.log('✅ 状态数据加载成功:', statusWords.value.length, '条记录')
            console.log('📊 状态数据样例:', statusWords.value.slice(0, 3))
            // 关联数据到单词
            associateStatusAndTagsToWords()
          } else {
            console.error('❌ 状态数据加载失败:', response.message)
            showToast(response.message || '加载状态数据失败')
          }
        } else {
          // 如果没有单词数据，加载所有状态数据
          console.log('🔍 没有单词数据，加载所有状态数据')
          const response = await getWordStatusList()
          if (response.code === 0) {
            statusWords.value = response.data || []
            console.log('✅ 所有状态数据加载成功:', statusWords.value.length, '条记录')
            console.log('📊 状态数据样例:', statusWords.value.slice(0, 3))
          } else {
            console.error('❌ 状态数据加载失败:', response.message)
            showToast(response.message || '加载状态数据失败')
          }
        }
      } catch (error) {
        console.error('加载状态数据失败:', error)
        showToast('网络错误，请稍后重试')
      } finally {
        loadingStatusData.value = false
      }
    }
    
    // 加载标签数据
    const loadTagData = async () => {
      try {
        loadingTagData.value = true
        
        // 如果已有单词数据，根据单词ID加载标签
        if (allWords.value.length > 0) {
          const wordIds = allWords.value.map(word => word.id)
          
          // 并行加载单词标签数据和可用标签列表
          const [wordTagResponse, tagListResponse] = await Promise.all([
            getWordTagList(wordIds),
            getTagList()
          ])
          
          if (wordTagResponse.code === 0) {
            tagWords.value = wordTagResponse.data || []
            console.log('单词标签数据加载成功:', tagWords.value.length)
            // 关联数据到单词
            associateStatusAndTagsToWords()
          } else {
            showToast(wordTagResponse.message || '加载单词标签数据失败')
          }
          
          if (tagListResponse.code === 0) {
            availableTags.value = tagListResponse.data || []
            console.log('可用标签列表加载成功:', availableTags.value.length)
          } else {
            showToast(tagListResponse.message || '加载标签列表失败')
          }
        } else {
          // 如果没有单词数据，加载所有标签数据
          const [wordTagResponse, tagListResponse] = await Promise.all([
            getWordTagList(),
            getTagList()
          ])
          
          if (wordTagResponse.code === 0) {
            tagWords.value = wordTagResponse.data || []
            console.log('单词标签数据加载成功:', tagWords.value.length)
          } else {
            showToast(wordTagResponse.message || '加载单词标签数据失败')
          }
          
          if (tagListResponse.code === 0) {
            availableTags.value = tagListResponse.data || []
            console.log('可用标签列表加载成功:', availableTags.value.length)
          } else {
            showToast(tagListResponse.message || '加载标签列表失败')
          }
        }
        
      } catch (error) {
        console.error('加载标签数据失败:', error)
        showToast('网络错误，请稍后重试')
      } finally {
        loadingTagData.value = false
      }
    }
    
    // 显示模式切换
    const switchDisplayMode = async (mode) => {
      currentDisplayMode.value = mode
      console.log(`切换显示模式到: ${mode}`)
      
      // 如果当前在单词详情页，切换模式时退出详情页
      if (selectedWord.value) {
        selectedWord.value = null
        console.log('🔙 退出单词详情页')
      }
      
      // 根据模式加载对应数据
      if (mode === 'status') {
        if (statusWords.value.length === 0) {
          await loadStatusData()
        } else {
          // 如果已有状态数据，重新关联到单词
          associateStatusAndTagsToWords()
        }
      } else if (mode === 'tag') {
        if (tagWords.value.length === 0) {
          await loadTagData()
        } else {
          // 如果已有标签数据，重新关联到单词
          associateStatusAndTagsToWords()
        }
      }
    }
    
    // 打开状态编辑弹窗
    const openStatusModal = (word) => {
      currentEditWord.value = word
      // 如果状态为0（未知），默认选择学习状态（1）
      statusForm.status = word.status > 0 ? word.status.toString() : '1'
      showStatusModal.value = true
    }
    
    // 关闭状态编辑弹窗
    const closeStatusModal = () => {
      showStatusModal.value = false
      currentEditWord.value = null
      statusForm.status = '1' // 默认为学习状态
    }
    
    // 提交状态更新
    const submitStatusUpdate = async () => {
      if (!currentEditWord.value) return
      
      try {
        updatingStatus.value = true
        
        // 调用真实API更新状态
        const response = await updateWordStatus({
          word_id: currentEditWord.value.id,
          status: parseInt(statusForm.status)
        })
        
        if (response.code === 0) {
          // 先更新本地数据以立即反馈
          const wordIndex = allWords.value.findIndex(w => w.id === currentEditWord.value.id)
          if (wordIndex !== -1) {
            allWords.value[wordIndex].status = parseInt(statusForm.status)
            wordsByLetter.value = categorizeWordsByLetter(allWords.value)
          }

          // 更新 statusWords 的本地缓存
          const targetId = currentEditWord.value.id
          const statusIndex = statusWords.value.findIndex(w => (w.word_id ?? w.wordId) === targetId)
          if (statusIndex !== -1) {
            statusWords.value[statusIndex].status = parseInt(statusForm.status)
          }

          // 保存成功后，重新获取该单词的最新状态并同步到页面
          try {
            const refreshResp = await getWordStatusList(targetId)
            if (refreshResp.code === 0) {
              const refreshed = (refreshResp.data || []).find(item => (item.word_id ?? item.wordId) === targetId)
              if (refreshed) {
                const refreshedStatus = Number(refreshed.status ?? refreshed.state ?? 0)
                // 更新 allWords
                const idx = allWords.value.findIndex(w => w.id === targetId)
                if (idx !== -1) {
                  allWords.value[idx].status = refreshedStatus
                }
                // 更新 statusWords
                const sIdx = statusWords.value.findIndex(w => (w.word_id ?? w.wordId) === targetId)
                if (sIdx !== -1) {
                  statusWords.value[sIdx] = { ...statusWords.value[sIdx], status: refreshedStatus }
                } else {
                  statusWords.value.push({ word_id: targetId, status: refreshedStatus })
                }
                // 重新关联与分类，确保 UI 更新
                associateStatusAndTagsToWords()
              }
            }
          } catch (e) {
            console.warn('刷新单词状态失败，使用本地更新值:', e)
          }

          showToast('状态更新成功')
          closeStatusModal()
        } else {
          showToast(response.message || '更新失败，请重试')
        }
      } catch (error) {
        console.error('更新状态失败:', error)
        showToast('网络错误，请稍后重试')
      } finally {
        updatingStatus.value = false
      }
    }
    
    // 打开标签编辑弹窗
    const openTagModal = async (word) => {
      currentEditWord.value = word
      tagForm.selectedTags = [...(word.tags || [])]
      
      // 如果还没有加载可用标签，先加载
      if (availableTags.value.length === 0) {
        try {
          const response = await getTagList()
          if (response.code === 0) {
            availableTags.value = response.data || []
          }
        } catch (error) {
          console.error('加载标签列表失败:', error)
        }
      }
      
      showTagModal.value = true
    }
    
    // 关闭标签编辑弹窗
    const closeTagModal = () => {
      showTagModal.value = false
      currentEditWord.value = null
      tagForm.selectedTags = []
    }
    
    // 检查标签是否已选中
    const isTagSelected = (tagId) => {
      return tagForm.selectedTags.some(tag => tag.id === tagId)
    }
    
    // 切换标签选择状态
    const toggleTag = (tag) => {
      const index = tagForm.selectedTags.findIndex(t => t.id === tag.id)
      if (index > -1) {
        tagForm.selectedTags.splice(index, 1)
      } else {
        tagForm.selectedTags.push(tag)
      }
    }
    
    // 移除标签
    const removeTag = (tagId) => {
      const index = tagForm.selectedTags.findIndex(t => t.id === tagId)
      if (index > -1) {
        tagForm.selectedTags.splice(index, 1)
      }
    }
    
    // 提交标签更新
    const submitTagUpdate = async () => {
      if (!currentEditWord.value) return
      
      try {
        updatingTags.value = true
        
        // 调用真实API更新标签
        const response = await updateWordTag({
          word_id: currentEditWord.value.id,
          tag_ids: tagForm.selectedTags.map(tag => tag.id)
        })
        
        if (response.code === 0) {
          // 更新本地数据
          const wordIndex = allWords.value.findIndex(w => w.id === currentEditWord.value.id)
          if (wordIndex !== -1) {
            allWords.value[wordIndex].tags = [...tagForm.selectedTags]
            // 重新分类单词
            wordsByLetter.value = categorizeWordsByLetter(allWords.value)
          }
          
          // 如果当前在标签模式，也更新标签数据
          if (currentDisplayMode.value === 'tag') {
            const tagIndex = tagWords.value.findIndex(w => w.id === currentEditWord.value.id)
            if (tagIndex !== -1) {
              tagWords.value[tagIndex].tags = [...tagForm.selectedTags]
            }
          }
          
          showToast('标签更新成功')
          closeTagModal()
        } else {
          showToast(response.message || '更新失败，请重试')
        }
      } catch (error) {
        console.error('更新标签失败:', error)
        showToast('网络错误，请稍后重试')
      } finally {
        updatingTags.value = false
      }
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
        
        const data = response.data || []
        const total = response.total_count || 0
        
        console.log(`✅ 单词加载成功，数据长度: ${data.length}, 总数: ${total}`)
        
        // 1. 首先更新单词列表并立即渲染（不添加状态和标签数据）
        if (append) {
          allWords.value = [...allWords.value, ...data]
        } else {
          allWords.value = data
        }
        
        // 更新分页信息
        currentOffset.value += data.length
        hasMoreWords.value = currentOffset.value < total
        
        // 重新分类单词（立即渲染）
        wordsByLetter.value = categorizeWordsByLetter(allWords.value)
        
        console.log(`📝 单词列表已更新并渲染，总数: ${allWords.value.length}`)
        console.log(`🔍 按字母分类结果:`, Object.keys(wordsByLetter.value).map(letter => `${letter}: ${wordsByLetter.value[letter].length}`).join(', '))
        
        // 2. 然后根据返回的单词ID异步加载状态和标签数据
        if (data.length > 0) {
          const wordIds = data.map(word => word.id)
          console.log(`🔄 开始异步加载状态和标签数据，单词ID数组:`, wordIds)
          
          // 异步加载状态和标签数据，不阻塞UI渲染
          loadStatusAndTagsByWordIds(wordIds, append)
        }
        
      } catch (err) {
        console.error(`💥 加载单词失败:`, err)
        // 不在这里设置错误信息，因为request.js的响应拦截器已经处理了
      } finally {
        loadingMore.value = false
      }
    }
    
    // 根据单词ID数组异步加载状态和标签数据
    const loadStatusAndTagsByWordIds = async (wordIds, append = false) => {
      console.log(`🔄 loadStatusAndTagsByWordIds 被调用，wordIds: ${wordIds.length}, append: ${append}`)
      
      try {
        // 并行调用状态和标签接口
        const [statusResponse, tagResponse] = await Promise.all([
          getWordStatusList(wordIds),
          getWordTagList(wordIds)
        ])
        
        console.log(`📥 状态数据响应:`, statusResponse)
        console.log(`📥 标签数据响应:`, tagResponse)
        
        // 处理状态数据
        if (statusResponse.code === 0) {
          const statusData = statusResponse.data || []
          console.log(`✅ 状态数据加载成功，数据长度: ${statusData.length}`)
          
          if (append) {
            statusWords.value = [...statusWords.value, ...statusData]
          } else {
            statusWords.value = statusData
          }
        } else {
          console.warn('状态数据加载失败:', statusResponse.message)
        }
        
        // 处理标签数据
        if (tagResponse.code === 0) {
          const tagData = tagResponse.data || []
          console.log(`✅ 标签数据加载成功，数据长度: ${tagData.length}`)
          
          if (append) {
            tagWords.value = [...tagWords.value, ...tagData]
          } else {
            tagWords.value = tagData
          }
        } else {
          console.warn('标签数据加载失败:', tagResponse.message)
        }
        
        // 关联数据到单词
        associateStatusAndTagsToWords()
        
      } catch (error) {
        console.error('加载状态和标签数据失败:', error)
        // 如果API调用失败，使用模拟数据作为后备
        console.log('🔄 使用模拟数据作为后备')
        generateMockStatusAndTags(wordIds, append)
      }
    }
    
    // 生成模拟状态和标签数据（作为API失败时的后备）
    const generateMockStatusAndTags = (wordIds, append = false) => {
      console.log(`🎭 生成模拟数据，wordIds: ${wordIds.length}`)
      
      // 生成模拟状态数据
      const mockStatusData = wordIds.map(wordId => ({
        word_id: wordId,
        status: Math.floor(Math.random() * 5) // 0-未知，1-学习状态，2-复习状态，3-强化状态，4-完成状态
      }))
      
      // 生成模拟标签数据
      const mockTagData = wordIds.map(wordId => ({
        word_id: wordId,
        tags: generateRandomTags()
      }))
      
      if (append) {
        statusWords.value = [...statusWords.value, ...mockStatusData]
        tagWords.value = [...tagWords.value, ...mockTagData]
      } else {
        statusWords.value = mockStatusData
        tagWords.value = mockTagData
      }
      
      // 关联数据到单词
      associateStatusAndTagsToWords()
    }
    
    // 将状态和标签数据关联到对应的单词
    const associateStatusAndTagsToWords = () => {
      console.log(`🔗 开始关联状态和标签数据到单词`)
      console.log('状态数据:', statusWords.value)
      console.log('标签数据:', tagWords.value)
      
      // 创建状态映射表（严格使用 word_id / wordId，不再使用 id 避免串词）
      const statusMap = {}
      statusWords.value.forEach(item => {
        const wordId = item.word_id ?? item.wordId
        const statusNum = Number(item.status ?? item.state ?? 0)
        if (wordId != null) {
          statusMap[wordId] = statusNum
        }
      })
      
      // 创建标签映射表（严格使用 word_id / wordId）
      const tagMap = {}
      tagWords.value.forEach(item => {
        const wordId = item.word_id ?? item.wordId
        const tags = item.tags || []
        if (wordId != null) {
          tagMap[wordId] = tags
        }
      })
      
      console.log('状态映射表:', statusMap)
      console.log('标签映射表:', tagMap)
      
      // 更新单词数据
      allWords.value = allWords.value.map(word => {
        const updatedWord = {
          ...word,
          status: statusMap[word.id] !== undefined ? statusMap[word.id] : 0, // 默认状态为0（未知）
          tags: tagMap[word.id] || [] // 默认无标签
        }
        return updatedWord
      })
      
      // 重新分类单词以反映更新
      wordsByLetter.value = categorizeWordsByLetter(allWords.value)
      
      console.log(`✅ 数据关联完成，已更新 ${allWords.value.length} 个单词`)
      console.log('更新后的单词示例:', allWords.value.slice(0, 3))
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
    

    
    // 预加载的音频对象缓存
    const audioCache = ref({})
    
    // 预加载音频资源
    const preloadAudio = (audioUrl, cacheKey) => {
      if (!audioUrl || audioCache.value[cacheKey]) return Promise.resolve()
      
      return new Promise((resolve) => {
        try {
          const audio = new Audio(getResourceUrl(audioUrl))
          audio.preload = 'auto'
          
          // 缓存音频对象
          audioCache.value[cacheKey] = audio
          
          audio.addEventListener('canplaythrough', () => {
            console.log(`音频预加载完成: ${cacheKey}`)
            resolve()
          }, { once: true })
          
          audio.addEventListener('error', (err) => {
            console.warn(`音频预加载失败: ${cacheKey}`, err)
            resolve()
          }, { once: true })
        } catch (err) {
          console.warn('预加载音频失败:', err)
          resolve()
        }
      })
    }
    
    // 预加载图片资源
    const preloadImage = (imageUrl) => {
      if (!imageUrl) return Promise.resolve()
      
      return new Promise((resolve) => {
        try {
          const img = new Image()
          img.onload = resolve
          img.onerror = resolve
          img.src = getResourceUrl(imageUrl)
        } catch (err) {
          console.warn('预加载图片失败:', err)
          resolve()
        }
      })
    }
    
    // 预加载单词相关资源
    const preloadWordResources = async (wordData) => {
      if (!wordData) return
      
      const preloadPromises = []
      
      // 预加载音频资源
      if (wordData.us_audio) {
        preloadPromises.push(preloadAudio(wordData.us_audio, `${wordData.id}_us`))
      }
      if (wordData.uk_audio) {
        preloadPromises.push(preloadAudio(wordData.uk_audio, `${wordData.id}_uk`))
      }
      
      // 预加载图片资源
      if (wordData.pos && Array.isArray(wordData.pos)) {
        wordData.pos.forEach(pos => {
          if (pos.picture) {
            preloadPromises.push(preloadImage(pos.picture))
          }
        })
      }
      
      // 并行预加载所有资源，但不阻塞UI
      Promise.allSettled(preloadPromises).then(() => {
        console.log('资源预加载完成')
      })
    }
    
    // 选择单词
    const selectWord = async (wordId) => {
      try {
        // 记录当前列表滚动位置，便于返回时恢复
        if (scrollContainer.value) {
          lastScrollTop.value = scrollContainer.value.scrollTop
        }
        // 设置进入详情页动画（页面向左滑入）
        transitionName.value = 'page-slide'
        const response = await getWordDetail(wordId)
        
        if (response.code === 0) {
          selectedWord.value = response.data
          // 重置展开状态
          showPictures.value = {}
          // 立即预加载音频和图片资源
          preloadWordResources(response.data)
        } else {
          showToast(response.message || '获取单词详情失败')
        }
      } catch (err) {
        console.error('获取单词详情失败:', err)
        showToast('网络错误，请稍后重试')
      }
    }
    
    // 返回列表
    const goBack = () => {
      selectedWord.value = null
      // 在列表重新渲染后恢复滚动位置
      nextTick(() => {
        if (scrollContainer.value) {
          scrollContainer.value.scrollTop = lastScrollTop.value || 0
        }
      })
    }

    // 过渡进入后钩子：在列表节点真正挂载并进入后恢复滚动位置
    const handleAfterEnter = (el) => {
      if (!el) return
      // 只在列表节点进入时处理
      if (el.classList && el.classList.contains('alphabetical-word-list')) {
        // 确保 ref 指向当前列表容器
        scrollContainer.value = el
        // 恢复到记录的滚动位置
        el.scrollTop = lastScrollTop.value || 0
      }
    }
    
    // 滑动手势处理
    let touchStartX = 0
    let touchStartY = 0
    let touchEndX = 0
    let touchEndY = 0
    
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }
    
    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].clientX
      touchEndY = e.changedTouches[0].clientY
      handleSwipeGesture()
    }
    
    const handleSwipeGesture = () => {
      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY
      const minSwipeDistance = 50
      
      // 确保是水平滑动且距离足够
      if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
        // 右滑手势
        if (deltaX > 0) {
          handleRightSwipe()
        }
        // 左滑手势
        else if (deltaX < 0) {
          handleLeftSwipe()
        }
      }
    }
    
    const handleRightSwipe = () => {
       // 如果当前在单词详情页面，右滑返回单词列表
       if (selectedWord.value) {
         // 设置右滑动画（页面向右滑出）
         transitionName.value = 'page-slide-right'
         goBack()
         // 优先恢复精确滚动位置
         nextTick(() => {
           if (scrollContainer.value) {
             scrollContainer.value.scrollTop = lastScrollTop.value || 0
           }
         })
       } else {
         // 如果在单词列表页面，右滑切换到练习页面
         // 设置向右滑动的动画效果
         transitionName.value = 'page-slide-right'
         router.push('/practice')
       }
     }
    
    const handleLeftSwipe = () => {
       // 只在单词列表页面处理左滑手势
       if (!selectedWord.value) {
         // 左滑切换到我的页面
         // 设置向左滑动的动画效果
         transitionName.value = 'page-slide-left'
         router.push('/profile')
       }
     }
    
    // 滚动到列表中指定单词的位置
    const scrollToWordInList = (wordText) => {
      if (!wordText) return
      
      const firstLetter = wordText.charAt(0).toLowerCase()
      const letterElement = document.getElementById(`letter-${firstLetter}`)
      
      if (letterElement) {
        letterElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    

    
    // 打开图片弹窗
     const openPictureModal = (index) => {
       const pos = selectedWord.value.pos[index]
       currentPosIndex.value = index
       currentPicture.value = pos.picture || ''
       originalPicture.value = pos.picture || ''
       generatedPicture.value = ''
       showPictureModal.value = true
     }
    
    // 关闭图片弹窗
    const closePictureModal = () => {
      showPictureModal.value = false
      showActionModal.value = false
      
      // 延迟重置状态，避免弹窗关闭过程中显示"未配置图片"
      setTimeout(() => {
        generatedPicture.value = ''
        currentPicture.value = ''
        originalPicture.value = ''
        currentPosIndex.value = -1
      }, 300) // 等待弹窗动画完成
    }
    
    // 生成图片
     const generatePicture = async () => {
       try {
         generatingPicture.value = true
         const pos = selectedWord.value.pos[currentPosIndex.value]
         
         const response = await generateWordPicture(pos.id)
         console.log('生成图片响应:', response)
         
         if (response.link) {
           generatedPicture.value = response.link
           // 直接覆盖当前显示的图片
           currentPicture.value = response.link
           showActionModal.value = true
           showToast('图片生成成功')
         }
       } catch (error) {
         console.error('生成图片失败:', error)
         // 不在这里显示错误信息，因为request.js的响应拦截器已经处理了
       } finally {
         generatingPicture.value = false
       }
     }
    
    // 应用图片
     const applyPicture = async () => {
       try {
         applyingPicture.value = true
         const pos = selectedWord.value.pos[currentPosIndex.value]
         
         const response = await updateWordPicture({
           word_pos_id: pos.id,
           picture: generatedPicture.value
         })
         
         console.log('应用图片响应:', response)
         
         // 更新本地数据，保存当前生成的图片
         selectedWord.value.pos[currentPosIndex.value].picture = generatedPicture.value
         currentPicture.value = generatedPicture.value
         // 更新原图片为新应用的图片
         originalPicture.value = generatedPicture.value
         showToast('图片应用成功')
         showActionModal.value = false
       } catch (error) {
         console.error('应用图片失败:', error)
         // 不在这里显示错误信息，因为request.js的响应拦截器已经处理了
       } finally {
         applyingPicture.value = false
       }
     }
    
    // 恢复图片
    const restorePicture = () => {
      generatedPicture.value = ''
      // 恢复显示原来的图片
      currentPicture.value = originalPicture.value
      showActionModal.value = false
      showToast('已恢复原图片')
    }
    
    // 关闭小型弹出提示
    const closeActionTooltip = () => {
      showActionModal.value = false
    }
    
    // 打开添加单词弹窗
    const openAddWordModal = () => {
      console.log('🔍 openAddWordModal 被调用')
      // 重置表单
      addWordForm.word = ''
      addWordForm.isGeneratePicture = false
      console.log('🔍 表单重置完成，word:', addWordForm.word)
      showAddWordModal.value = true
      console.log('🔍 弹窗已打开')
    }
    
    // 关闭添加单词弹窗
    const closeAddWordModal = () => {
      showAddWordModal.value = false
      // 重置表单
      addWordForm.word = ''
      addWordForm.isGeneratePicture = false
    }
    
    // 提交添加单词
    const submitAddWord = async () => {
      // 基本的非空验证
      if (!addWordForm.word.trim()) {
        showToast('请输入单词')
        return
      }
      
      try {
        addingWord.value = true
        
        const response = await addWord({
          word: addWordForm.word.trim(),
          is_generate_picture: addWordForm.isGeneratePicture
        })
        
        // 成功时的处理
        showToast('单词添加成功')
        closeAddWordModal()
        // 刷新单词列表
        await initializeWordList()
      } catch (error) {
        console.error('添加单词失败:', error)
        // 不在这里显示错误信息，因为request.js的响应拦截器已经处理了
      } finally {
        addingWord.value = false
      }
    }
    
    // 处理单词输入
    const handleWordInput = (event) => {
      console.log('🔍 handleWordInput 被调用，事件对象:', event)
      
      // 从事件对象中获取输入值
      const value = event.target.value
      addWordForm.word = value
      
      console.log('🔍 表单值已更新为:', addWordForm.word)
    }
    
    // 处理键盘输入事件
    const handleWordKeydown = (event) => {
      // 移除所有字符限制，允许用户输入任何内容
      // 不做任何处理，让浏览器默认行为处理输入
    }
    
    // 音频播放状态
    const audioPlaying = ref({})
    
    // 播放音频（带防抖和动画效果）
    const playAudio = (audioUrl, index = 'default') => {
      // 防抖处理：如果正在播放，则忽略
      if (audioPlaying.value[index]) {
        return
      }
      
      try {
        // 设置播放状态
        audioPlaying.value[index] = true
        
        // 构建缓存键
        const cacheKey = `${selectedWord.value?.id}_${index}`
        
        // 优先使用预加载的音频对象
        let audio = audioCache.value[cacheKey]
        
        if (!audio) {
          // 如果没有预加载的音频，创建新的
          audio = new Audio(getResourceUrl(audioUrl))
          console.log('使用新创建的音频对象:', cacheKey)
        } else {
          console.log('使用预加载的音频对象:', cacheKey)
        }
        
        // 重置音频到开始位置
        audio.currentTime = 0
        
        // 音频播放结束后重置状态
        const handleEnded = () => {
          audioPlaying.value[index] = false
          audio.removeEventListener('ended', handleEnded)
          audio.removeEventListener('error', handleError)
        }
        
        // 音频播放失败后重置状态
        const handleError = () => {
          audioPlaying.value[index] = false
          audio.removeEventListener('ended', handleEnded)
          audio.removeEventListener('error', handleError)
        }
        
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)
        
        audio.play().catch(err => {
          console.error('音频播放失败:', err)
          audioPlaying.value[index] = false
          showToast('音频播放失败')
        })
        
        // 音频播放完成后会自动重置状态
        
      } catch (err) {
        console.error('音频播放失败:', err)
        audioPlaying.value[index] = false
        showToast('音频播放失败')
      }
    }
    
    // ========== 图片上传相关函数 ==========
    
    // 生成上传文件路径
    const generateUploadPath = (word, pos, fileExtension = 'png') => {
      const userId = getUserId() || getUserInfo()?.id || 'unknown'
      const timestamp = Math.floor(Date.now() / 1000)
      return `picture/user_word_${userId}/${word}/${pos}_${timestamp}.${fileExtension}`
    }
    
    // 文件选择器
    const selectImageFile = () => {
      return new Promise((resolve, reject) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.multiple = false
        
        input.onchange = (event) => {
          const files = event.target.files
          if (files && files.length > 0) {
            const file = files[0]
            
            // 验证文件类型
            if (!file.type.startsWith('image/')) {
              reject(new Error('请选择图片文件'))
              return
            }
            
            // 验证文件大小（限制为10MB）
            if (file.size > 10 * 1024 * 1024) {
              reject(new Error('图片大小不能超过10MB'))
              return
            }
            
            resolve(file)
          } else {
            reject(new Error('未选择文件'))
          }
        }
        
        input.oncancel = () => {
          reject(new Error('用户取消选择'))
        }
        
        // 触发文件选择
        input.click()
      })
    }
    
    // 打开图片上传
    const openImageUpload = async () => {
      try {
        const file = await selectImageFile()
        selectedImageFile.value = file
        
        // 创建图片预览URL
        const reader = new FileReader()
        reader.onload = (e) => {
          selectedImageSrc.value = e.target.result
          showCropModal.value = true
        }
        reader.readAsDataURL(file)
        
      } catch (error) {
        if (error.message !== '用户取消选择') {
          showToast(error.message)
        }
      }
    }
    
    // 关闭裁剪弹窗
    const closeCropModal = () => {
      showCropModal.value = false
      selectedImageFile.value = null
      selectedImageSrc.value = ''
      uploadedImagePath.value = ''
    }
    
    // 确认裁剪并上传
    const confirmCrop = async () => {
      if (!cropper.value || !selectedImageFile.value) {
        showToast('请先选择图片')
        return
      }
      
      try {
        uploadingImage.value = true
        
        // 使用vue-cropper@1.0.3的API获取裁剪结果
        const blob = await new Promise((resolve, reject) => {
          try {
            // 使用getCropBlob直接获取blob数据
            cropper.value.getCropBlob((data) => {
              resolve(data)
            })
          } catch (error) {
            reject(error)
          }
        })
        
        // 获取原始文件的扩展名
        const originalExtension = selectedImageFile.value.name.split('.').pop().toLowerCase()
        
        // 创建File对象，使用原始文件的扩展名
        const croppedFile = new File([blob], `cropped_image.${originalExtension}`, {
          type: `image/${originalExtension}`
        })
        
        // 生成上传路径，使用原始文件的扩展名
        const pos = selectedWord.value.pos[currentPosIndex.value]
        const uploadPath = generateUploadPath(selectedWord.value.word, pos.pos, originalExtension)
        
        // 上传文件
        const uploadResult = await uploadFile(croppedFile, 'englishstudy', uploadPath)
        
        if (uploadResult.code === 0 && uploadResult.path) {
          uploadedImagePath.value = uploadResult.path
          
          // 关闭裁剪弹窗
          closeCropModal()
          
          // 设置为生成的图片，复用现有的应用确认流程
          generatedPicture.value = uploadResult.path
          currentPicture.value = uploadResult.path
          
          // 显示应用确认弹窗
          showActionModal.value = true
          
          showToast('图片上传成功，请确认是否应用')
        } else {
          throw new Error(uploadResult.message || '上传失败')
        }
        
      } catch (error) {
        console.error('图片上传失败:', error)
        showToast(error.message || '图片上传失败')
      } finally {
        uploadingImage.value = false
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
      transitionName,
      
      // 显示模式相关
      currentDisplayMode,
      displayModes,
      
      // 状态编辑相关
      showStatusModal,
      currentEditWord,
      updatingStatus,
      statusForm,
      
      // 标签编辑相关
      showTagModal,
      updatingTags,
      tagForm,
      presetTags,
      
      // 单词数据
      allWords,
      wordsByLetter,
      hasMoreWords,
      loadingMore,
      currentOffset,
      
      // 状态和标签数据
      statusWords,
      tagWords,
      availableTags,
      loadingStatusData,
      loadingTagData,
      
      // 图片相关
      showPictures,
      pictureLoading,
      pictureErrors,
      
      // 音频相关
      audioPlaying,
      audioCache,
      
      // 图片弹窗相关
      showPictureModal,
      showActionModal,
      currentPicture,
      generatedPicture,
      generatingPicture,
      applyingPicture,
      currentPosIndex,
      originalPicture,
      
      // 图片上传相关
      showCropModal,
      selectedImageFile,
      selectedImageSrc,
      uploadingImage,
      cropper,
      uploadedImagePath,
      
      // 添加单词相关
      showAddWordModal,
      addingWord,
      addWordForm,
      
      // 方法
      getPosName,
      getExchangeName,
      getStatusText,
      getStatusClass,
      getFilteredWordsForStatus,
      switchDisplayMode,
      selectWord,
      goBack,
      
      // 状态编辑方法
      openStatusModal,
      closeStatusModal,
      submitStatusUpdate,
      
      // 标签编辑方法
      openTagModal,
      closeTagModal,
      isTagSelected,
      toggleTag,
      removeTag,
      submitTagUpdate,
      openPictureModal,
      closePictureModal,
      generatePicture,
      applyPicture,
      restorePicture,
      closeActionTooltip,
      playAudio,
      loadMoreWords,
      openAddWordModal,
      closeAddWordModal,
      submitAddWord,
      handleWordInput,
      handleWordKeydown,
      
      // 图片上传方法
      openImageUpload,
      closeCropModal,
      confirmCrop,
      generateUploadPath,
      selectImageFile,
      
      // 触摸事件处理
      handleTouchStart,
      handleTouchEnd,
      handleRightSwipe,
      handleLeftSwipe,
      
      // 工具方法
      getResourceUrl,
      // 过渡钩子
      handleAfterEnter
    }
  }
}
</script>

<style lang="scss" scoped>
.dictionary-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
}

.dictionary-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px 30px;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
    pointer-events: none;
  }
  
  .page-title {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: 1px;
    position: relative;
    z-index: 1;
  }
  
  .page-subtitle {
    font-size: 14px;
    opacity: 0.9;
    letter-spacing: 0.5px;
    position: relative;
    z-index: 1;
  }
}

.dictionary-content {
  padding: 32px 20px 40px;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 按字母分类的单词列表样式 */
.alphabetical-word-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding-bottom: 24px;
  position: relative;
  z-index: 1;
}

/* 字母组样式 */
.letter-group {
  margin-bottom: 20px;
  position: relative;
}

/* 添加单词浮动按钮 */
.add-word-fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  .van-icon {
    color: white;
    font-weight: bold;
  }
}

/* 添加单词弹窗样式 */
.add-word-modal {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  
  .modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      color: white;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    }
    
    .close-btn {
      color: white;
      font-size: 22px;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.15);
        transform: scale(1.1);
      }
    }
  }
  
  .modal-content {
    padding: 24px;
    
    .van-field {
      margin-bottom: 20px;
      
      :deep(.van-field__label) {
        color: #2c3e50;
        font-weight: 600;
        font-size: 15px;
        letter-spacing: 0.3px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      }
      
      :deep(.van-field__control) {
        border-radius: 8px;
        font-size: 16px;
        font-weight: 400;
        color: #34495e;
        line-height: 1.5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      }
      
      :deep(.van-field__control::placeholder) {
        color: #95a5a6;
        font-weight: 400;
        font-style: italic;
      }
    }
    
    .van-checkbox {
      :deep(.van-checkbox__label) {
        color: #5a6c7d;
        font-size: 15px;
        font-weight: 500;
        letter-spacing: 0.2px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      }
    }
  }
  
  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 28px;
    
    .action-btn {
      flex: 1;
      height: 46px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      
      &.cancel-btn {
        background: #ecf0f1;
        color: #7f8c8d;
        border: none;
        
        &:hover {
          background: #d5dbdb;
          color: #5a6c7d;
          transform: translateY(-1px);
        }
      }
      
      &.submit-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        
        &:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        &:disabled {
          background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%) !important;
          color: #7f8c8d !important;
          text-shadow: none !important;
          opacity: 1 !important;
          transform: none !important;
          box-shadow: 0 2px 8px rgba(189, 195, 199, 0.3) !important;
          cursor: not-allowed !important;
        }
        
        &.disabled-btn {
          background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%) !important;
          color: #7f8c8d !important;
          text-shadow: none !important;
          cursor: not-allowed !important;
        }
      }
    }
  }
}

/* 字母标签样式 - 通讯录风格 */
.letter-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 字母下的单词列表 */
.letter-words {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  padding-top: 12px;
  position: relative;
  border: 1px solid rgba(102, 126, 234, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
    pointer-events: none;
  }
}

.word-item {
  border-bottom: 1px solid rgba(102, 126, 234, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 48px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
}

.word-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  border-left: 3px solid rgba(102, 126, 234, 0.3);
  
  &::before {
    transform: translateX(0);
  }
}

.word-item:last-child {
  border-bottom: none;
}

/* 加载状态样式 */
.letter-loading {
  text-align: center;
  padding: 20px;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.global-loading {
  text-align: center;
  padding: 32px;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.1);
  margin-top: 24px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

/* 无单词提示 */
.no-words {
  text-align: center;
  padding: 24px;
  background: linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  margin-bottom: 16px;
  border: 2px dashed rgba(102, 126, 234, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.no-words-text {
  color: #666;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 单词详情样式 */
.word-detail {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 自定义导航栏样式 */
.custom-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.custom-nav-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  pointer-events: none;
}

.nav-left {
  flex: 1;
  display: flex;
  align-items: center;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-btn:active {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.2);
}

.back-icon {
  width: 16px;
  height: 16px;
  color: white;
  transition: transform 0.3s ease;
}

.back-btn:hover .back-icon {
  transform: translateX(-2px);
}

.back-text {
  font-size: 13px;
  font-weight: 500;
  color: white;
}

.nav-center {
  flex: 2;
  text-align: center;
  position: relative;
  z-index: 1;
}

.nav-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
}

.nav-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
  font-weight: 400;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.nav-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.word-card {
  padding: 24px;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 0 0 16px 16px;
}

.word-title {
  text-align: center;
  margin-bottom: 20px;
  padding: 20px 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.word-title::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  pointer-events: none;
}

.word-title h2 {
  color: #2c3e50;
  font-size: 36px;
  font-weight: 800;
  margin: 0;
  text-align: center;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
}

/* 音标部分样式 */
.phonetic-section {
  margin: 24px 0;
  padding: 20px;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.08);
  position: relative;
  overflow: hidden;
}

.phonetic-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
  pointer-events: none;
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

.audio-btn-container {
  position: relative;
  display: inline-block;
}

.play-btn {
  min-width: 40px;
  height: 32px;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  transition: all 0.3s ease;
  padding: 0 !important;
}

.play-btn:hover {
  background: transparent !important;
  color: #1989fa !important;
  transform: scale(1.1);
}

.play-btn.playing {
  animation: pulse 1s infinite;
  color: #52c41a !important;
  background: transparent !important;
}

.play-btn:active {
  background: transparent !important;
}

.play-btn:focus {
  background: transparent !important;
  outline: none !important;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 声音扩散动画 */
.sound-waves {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: -1;
}

.wave {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid #52c41a;
  border-radius: 50%;
  opacity: 0;
  animation: soundWave 2s infinite;
}

.wave-1 {
  animation-delay: 0s;
}

.wave-2 {
  animation-delay: 0.4s;
}

.wave-3 {
  animation-delay: 0.8s;
}

@keyframes soundWave {
  0% {
    width: 20px;
    height: 20px;
    opacity: 1;
  }
  50% {
    width: 60px;
    height: 60px;
    opacity: 0.5;
  }
  100% {
    width: 100px;
    height: 100px;
    opacity: 0;
  }
}

/* 词性部分样式 */
.pos-section {
  margin-top: 24px;
}

.pos-section h3 {
  color: #2c3e50;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.pos-item {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.pos-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.pos-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  display: inline-block;
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.pos-translation {
  font-size: 17px;
  color: #2c3e50;
  font-weight: 600;
  line-height: 1.5;
  margin-top: 8px;
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

/* 图片按钮样式 */
.picture-action {
  margin-top: 15px;
  text-align: center;
  padding: 10px 0;
}

.picture-toggle-btn {
  border-radius: 20px;
  font-size: 14px;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(25, 137, 250, 0.2);
  transition: all 0.3s ease;
}

.picture-toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
}

/* 图片弹窗样式 */
.picture-modal {
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  font-size: 20px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #666;
}

.modal-content {
  margin-bottom: 20px;
}

.current-picture,
.generated-picture {
  margin-bottom: 16px;
}

.current-picture .van-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
}

.generated-picture h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.modal-picture {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-picture {
  padding: 40px 20px;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  flex: 1;
  max-width: 120px;
  border-radius: 20px;
  font-weight: 500;
}

/* 小型弹出提示样式 */
.action-tooltip {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: auto;
}

.tooltip-content {
  position: absolute;
  top: 610px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #e8e8e8;
  min-width: 140px;
}

.tooltip-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.tooltip-btn {
  min-width: 60px;
  height: 32px;
  font-size: 13px;
  border-radius: 16px;
  font-weight: 500;
}



/* 图片样式 */
.picture-section {
  margin-top: 15px;
  text-align: center;
}

.pos-picture {
  width: 100%;
  aspect-ratio: 1;
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

/* 页面切换动画样式 */
/* 默认动画：列表进入详情页（向左滑入） */
.page-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1);
}

.page-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.page-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
  filter: blur(2px);
}

.page-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
  filter: blur(2px);
}

.page-slide-enter-to,
.page-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
  filter: blur(0);
}

/* 右滑动画：详情页返回列表或列表切换到练习页（向右滑出） */
.page-slide-right-enter-active {
  transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1);
}

.page-slide-right-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.page-slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
  filter: blur(2px);
}

.page-slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
  filter: blur(2px);
}

.page-slide-right-enter-to,
.page-slide-right-leave-from {
  transform: translateX(0);
  opacity: 1;
  filter: blur(0);
}

/* 左滑动画：列表切换到我的页面（向左滑出） */
.page-slide-left-enter-active {
  transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1);
}

.page-slide-left-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.page-slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
  filter: blur(2px);
}

.page-slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
  filter: blur(2px);
}

.page-slide-left-enter-to,
.page-slide-left-leave-from {
  transform: translateX(0);
  opacity: 1;
  filter: blur(0);
}

/* 确保动画容器有正确的定位 */
.dictionary-content {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 20px;
  margin: 10px;
}

.alphabetical-word-list,
.word-detail {
  width: 100%;
  min-height: 400px;
  will-change: transform, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* 添加页面切换时的阴影效果 */
.page-slide-enter-active .alphabetical-word-list,
.page-slide-enter-active .word-detail {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* 裁剪组件样式 */
.crop-container {
  width: 100%;
  height: 300px;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #f5f5f5;
}

.cropper-component {
  width: 100%;
  height: 100%;
}

/* 确保vue-cropper组件正确显示 */
.crop-container .vue-cropper {
  width: 100% !important;
  height: 100% !important;
}

.page-slide-leave-active .alphabetical-word-list,
.page-slide-leave-active .word-detail {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

/* 裁剪弹窗优化样式 */
.crop-modal {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(102, 126, 234, 0.1);
  position: relative;
}

.crop-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
  pointer-events: none;
  z-index: 0;
}

.crop-modal .modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
  margin: 0;
  border-bottom: none;
  position: relative;
  z-index: 1;
}

.crop-modal .modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  pointer-events: none;
}

.crop-modal .modal-header h3 {
  color: white;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.crop-modal .close-btn {
  color: white;
  font-size: 22px;
  padding: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  z-index: 1;
}

.crop-modal .close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.crop-modal .close-btn:active {
  transform: scale(0.95);
}

.crop-modal .modal-content {
  padding: 24px;
  margin: 0;
  position: relative;
  z-index: 1;
}

.crop-modal .crop-container {
  background: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid rgba(102, 126, 234, 0.1);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(102, 126, 234, 0.1);
  position: relative;
}

.crop-modal .crop-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
  pointer-events: none;
  z-index: 0;
}

.crop-modal .modal-actions {
  padding: 20px 24px 24px;
  background: linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%);
  border-top: 1px solid rgba(102, 126, 234, 0.1);
  gap: 16px;
  position: relative;
  z-index: 1;
}

.crop-modal .action-btn {
  height: 48px;
  border-radius: 24px;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  border: none;
  position: relative;
  overflow: hidden;
}

.crop-modal .cancel-btn {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(108, 117, 125, 0.3);
}

.crop-modal .cancel-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(108, 117, 125, 0.4);
}

.crop-modal .cancel-btn:active {
  transform: translateY(0);
}

.crop-modal .confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.crop-modal .confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.crop-modal .confirm-btn:active {
  transform: translateY(0);
}

.crop-modal .action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.crop-modal .action-btn:hover::before {
  left: 100%;
}

/* 显示模式切换栏样式 */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-text {
  flex: 1;
}

.display-mode-switcher {
  display: flex;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 4px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  .mode-option {
    padding: 8px 16px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.8);
    white-space: nowrap;
    
    &.active {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    &:hover:not(.active) {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
  }
}

/* 状态和标签模式的单词项样式 */
.word-item {
  &.clickable {
    cursor: pointer;
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: #f5f5f5;
    }
    
    &:active {
      background-color: #e8e8e8;
    }
  }
  
  /* 提升列表中文字的清晰度 */
  .van-cell__title {
    color: #1f2937; /* 更深的文字颜色提升对比度 */
    font-weight: 600;
    text-shadow: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  &.status-mode, &.tag-mode {
    .word-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .word-text {
      font-weight: 600;
      color: #2c3e50;
    }
    
    // 状态指示器样式
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 20px;
      transition: all 0.3s ease;
      white-space: nowrap; /* 防止文字换行被截断 */
      margin-right: 22px; /* 向中间移动一些，避免靠右被遮挡 */
      transform: translateX(-6px);
    
      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
    
      .status-text {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.3px;
        transition: all 0.3s ease;
      }
      
      // 未知状态 - 灰色
      &.unknown {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border: 1px solid #dee2e6;
        
        .status-dot {
          background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
        }
        
        .status-text {
          color: #6c757d;
        }
      }
      
      // 学习状态 - 蓝色
      &.study {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border: 1px solid #90caf9;
        
        .status-dot {
          background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
        }
        
        .status-text {
          color: #1565c0;
        }
      }
      
      // 复习状态 - 橙色
      &.review {
        background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
        border: 1px solid #ffcc02;
        
        .status-dot {
          background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
          box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
        }
        
        .status-text {
          color: #e65100;
        }
      }
      
      // 强化状态 - 深橙色
      &.strengthen {
        background: linear-gradient(135deg, #fbe9e7 0%, #ffccbc 100%);
        border: 1px solid #ff8a65;
        
        .status-dot {
          background: linear-gradient(135deg, #ff5722 0%, #d84315 100%);
          box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3);
        }
        
        .status-text {
          color: #bf360c;
        }
      }
      
      // 完成状态 - 绿色
      &.finish {
        background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
        border: 1px solid #81c784;
        
        .status-dot {
          background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }
        
        .status-text {
          color: #2e7d32;
        }
      }
      
      // 悬停效果
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        
        .status-dot {
          transform: scale(1.1);
        }
      }
    }
    
    .word-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      
      .tag-item {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        color: white;
        font-weight: 500;
        white-space: nowrap;
      }
    }
    /* 将状态指示器整体向左移动一些，避免贴边被截断（深度选择器以覆盖 Vant 内部结构） */
    :deep(.van-cell__value) {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      overflow: visible;
      padding-right: 18px; /* 增加内边距，整体更靠中间 */
    }
    /* 防止气泡被单元格右边界裁切（需作用在 cell 本身）*/
    .word-item.status-mode {
      overflow: visible;
      padding-right: 8px; /* 给右侧留一点缓冲区 */
    }
    :deep(.van-cell) { overflow: visible; }
  }
}

/* 状态编辑弹窗样式 */
.status-modal {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  
  .modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      color: white;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
    }
    
    .close-btn {
      color: white;
      font-size: 22px;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.15);
      }
    }
  }
  
  .modal-content {
    padding: 24px;
    
    .word-info {
      text-align: center;
      margin-bottom: 24px;
      
      h4 {
        font-size: 24px;
        font-weight: 700;
        color: #2c3e50;
        margin: 0 0 8px 0;
      }
      
      .word-subtitle {
        color: #7f8c8d;
        font-size: 14px;
        margin: 0;
      }
    }
    
    .status-radio {
      margin-bottom: 16px;
      
      .radio-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border: 2px solid #ddd;
        border-radius: 50%;
        margin-right: 12px;
        
        &.checked {
          border-color: #667eea;
          background: #667eea;
        }
        
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          
          &.unknown {
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
          }
          
          &.study {
            background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
            box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
          }
          
          &.review {
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
          }
          
          &.strengthen {
            background: linear-gradient(135deg, #ff5722 0%, #d84315 100%);
            box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3);
          }
          
          &.finish {
            background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
          }
        }
      }
    }
    
    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      
      .action-btn {
        flex: 1;
        height: 48px;
        border-radius: 24px;
        font-weight: 600;
        font-size: 16px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &.cancel-btn {
          background: #6c757d;
          color: white;
          
          &:hover {
            background: #5a6268;
          }
        }
        
        &.submit-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
          }
        }
      }
    }
  }
}

/* 标签编辑弹窗样式 */
.tag-modal {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  
  .modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      color: white;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
    }
    
    .close-btn {
      color: white;
      font-size: 22px;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.15);
      }
    }
  }
  
  .modal-content {
    padding: 24px;
    
    .word-info {
      text-align: center;
      margin-bottom: 24px;
      
      h4 {
        font-size: 24px;
        font-weight: 700;
        color: #2c3e50;
        margin: 0 0 8px 0;
      }
      
      .word-subtitle {
        color: #7f8c8d;
        font-size: 14px;
        margin: 0;
      }
    }
    
    .current-tags-section, .preset-tags-section {
      margin-bottom: 20px;
      
      h5 {
        font-size: 16px;
        font-weight: 600;
        color: #2c3e50;
        margin: 0 0 12px 0;
      }
    }
    
    .current-tags, .preset-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .tag-item {
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 14px;
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        
        &.current {
          .remove-icon {
            font-size: 12px;
            opacity: 0.8;
            
            &:hover {
              opacity: 1;
            }
          }
        }
        
        &.preset {
          opacity: 0.7;
          
          &:hover {
            opacity: 0.9;
            transform: translateY(-2px);
          }
          
          &.selected {
            opacity: 1;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }
        }
      }
      
      .no-tags {
        color: #95a5a6;
        font-style: italic;
        padding: 8px 0;
      }
    }
    
    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      
      .action-btn {
        flex: 1;
        height: 48px;
        border-radius: 24px;
        font-weight: 600;
        font-size: 16px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &.cancel-btn {
          background: #6c757d;
          color: white;
          
          &:hover {
            background: #5a6268;
          }
        }
        
        &.submit-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
          }
        }
      }
    }
  }
}

</style>