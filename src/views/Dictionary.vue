<template>
  <div class="dictionary-page" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <!-- 头部 -->
    <div class="dictionary-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">英语词典</h1>
          <p class="page-subtitle">学习及查找词语</p>
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
        <!-- 右侧书签切换：单词 / 短语 (仅在列表页显示，进入详情后隐藏) -->
        <div v-if="!selectedWord && !selectedPhrase" class="resource-switcher">
          <div
            class="bookmark-option"
            :class="{ active: resourceType === 'word' }"
            @click="switchResourceType('word')"
          >单词</div>
          <div
            class="bookmark-option"
            :class="{ active: resourceType === 'phrase' }"
            @click="switchResourceType('phrase')"
          >短语</div>
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
        <!-- 资源列表（按字母分类） -->
        <div v-if="!selectedWord && !selectedPhrase" key="resource-list" class="alphabetical-word-list" ref="scrollContainer">

        <div v-for="currentLetter in lettersToLoop" :key="currentLetter" class="letter-group">
          <!-- 该字母下的单词列表 -->
          <div class="letter-words">
            <!-- 字母标签 -->
            <div class="letter-tag" :id="`letter-${currentLetter}`">
              {{ currentLetter.toUpperCase() }}
            </div>
            <!-- 列表模式：根据书签展示单词或短语 -->
            <van-cell
              v-if="resourceType === 'word' && currentDisplayMode === 'word'"
              v-for="word in wordsByLetter[currentLetter]"
              :key="word.id"
              :title="word.word"
              is-link
              @click="selectWord(word.id)"
              class="word-item"
            />
            <van-cell
              v-else-if="resourceType === 'phrase' && currentDisplayMode === 'word'"
              v-for="item in (phrasesByLetter[currentLetter] || [])"
              :key="item.id"
              :title="item.word"
              is-link
              @click="selectPhrase(item.id)"
              class="word-item phrase-mode"
            >
              <template #label>
                <div class="phrase-subtitle">
                </div>
              </template>
            </van-cell>

            <!-- 状态模式：单词 -->
            <van-cell
              v-if="currentDisplayMode === 'status' && resourceType === 'word'"
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

            <!-- 状态模式：短语 -->
            <van-cell
              v-else-if="currentDisplayMode === 'status' && resourceType === 'phrase'"
              v-for="item in getFilteredPhrasesForStatus(currentLetter)"
              :key="item.id"
              :title="item.word"
              is-link
              clickable
              @click="openStatusModal(item)"
              class="word-item status-mode clickable phrase-mode"
            >
              <template #label>
                <div class="phrase-subtitle">
                </div>
              </template>
              <template #value>
                <div class="status-indicator" :class="getStatusClass(item.status)" v-if="item.status > 0">
                  <span class="status-dot"></span>
                  <span class="status-text">{{ getStatusText(item.status) }}</span>
                </div>
              </template>
            </van-cell>

            <!-- 标签模式：单词 -->
            <van-cell
              v-else-if="currentDisplayMode === 'tag' && resourceType === 'word'"
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
                    :style="{ backgroundColor: tag.style || tag.color || '#1989fa' }"
                  >
                    {{ tag.name }}
                  </span>
                  <span v-if="!word.tags || word.tags.length === 0" class="no-tags">暂无标签</span>
                </div>
              </template>
            </van-cell>

            <!-- 标签模式：短语 -->
            <van-cell
              v-else-if="currentDisplayMode === 'tag' && resourceType === 'phrase'"
              v-for="item in (phrasesByLetter[currentLetter] || [])"
              :key="item.id"
              :title="item.word"
              is-link
              @click="openTagModal(item)"
              class="word-item tag-mode phrase-mode"
            >
              <template #label>
                <div class="word-tags">
                  <span
                    v-for="tag in item.tags || []"
                    :key="tag.id"
                    class="tag-item"
                    :style="{ backgroundColor: tag.style || tag.color || '#1989fa' }"
                  >
                    {{ tag.name }}
                  </span>
                  <span v-if="!item.tags || item.tags.length === 0" class="no-tags">暂无标签</span>
                </div>
              </template>
            </van-cell>

          </div>
        </div>

        <!-- 加载更多状态 -->
        <div v-if="loadingMore && currentDisplayMode === 'word'" class="global-loading">
          <van-loading size="20px" vertical>加载更多单词...</van-loading>
        </div>
        <div v-if="loadingMorePhrases && resourceType === 'phrase' && currentDisplayMode === 'word'" class="global-loading">
          <van-loading size="20px" vertical>加载更多短语...</van-loading>
        </div>

        <!-- 状态数据加载状态 -->
        <div v-if="loadingStatusData && currentDisplayMode === 'status'" class="global-loading">
          <van-loading size="20px" vertical>加载状态数据...</van-loading>
        </div>

        <!-- 标签数据加载状态 -->
        <div v-if="loadingTagData && currentDisplayMode === 'tag'" class="global-loading">
          <van-loading size="20px" vertical>加载标签数据...</van-loading>
        </div>
        <div v-if="loadingPhraseData && resourceType === 'phrase' && currentDisplayMode === 'word'" class="global-loading">
          <van-loading size="20px" vertical>加载短语数据...</van-loading>
        </div>

          <!-- 已加载完毕提示 -->
          <div v-if="!hasMoreWords && allWords.length > 0 && currentDisplayMode === 'word'" class="load-complete">
            <van-divider>已加载全部单词</van-divider>
          </div>
          <div v-if="!hasMorePhrases && phraseList.length > 0 && currentDisplayMode === 'phrase'" class="load-complete">
            <van-divider>已加载全部短语</van-divider>
          </div>
        </div>

        <!-- 单词详情卡片 -->
        <WordDetailView
          v-else-if="selectedWord"
          key="word-detail"
          :selectedWord="selectedWord"
          :audioPlaying="audioPlaying"
          @back="goBack"
          @play-audio="playAudio"
          @open-picture="openPictureModal"
        />

        <!-- 短语详情卡片 -->
        <PhraseDetailView
          v-else-if="selectedPhrase"
          key="phrase-detail"
          :selectedPhrase="selectedPhrase"
          :audioPlaying="audioPlaying"
          @back="goBack"
          @play-audio="playAudio"
          @open-picture="openPhrasePictureModal"
        />
      </transition>
    </div>

    <!-- 图片查看弹窗 -->
    <PictureModal
      :show="showPictureModal"
      :currentPicture="currentPicture"
      :isWord="!!selectedWord"
      :generatingPicture="generatingPicture"
      :uploadingImage="uploadingImage"
      :hasPending="showActionModal"
      :applyingPicture="applyingPicture"
      @close="closePictureModal"
      @generate="generatePicture"
      @upload="openImageUpload"
      @search="openImageSearch"
      @apply="applyPicture"
      @restore="restorePicture"
    />

    <!-- 图片搜索弹窗 -->
    <ImageSearchModal
      :show="showImageSearchModal"
      :defaultQuery="imageSearchDefaultQuery"
      @close="showImageSearchModal = false"
      @select="onImageSearchSelect"
    />

    <!-- 图片裁剪弹窗 -->
    <ImageCropModal
      :show="showCropModal"
      :imageSrc="selectedImageSrc"
      :uploading="uploadingImage"
      @close="closeCropModal"
      @confirm="confirmCrop"
    />

    <SearchModal :show="showSearchModal" :type="resourceType" @close="closeSearchModal" @select="selectSearchResult" />

    <SearchAddModal
      :show="showSearchAddModal"
      @close="showSearchAddModal = false"
      @added="showSearchAddModal = false"
    />

    <ShareGenerateModal
      :show="showShareGenerateModal"
      @close="showShareGenerateModal = false"
    />

    <ShareImportModal
      :show="showShareImportModal"
      @close="showShareImportModal = false"
      @imported="initializeWordList"
    />


    <!-- 浮动按钮 -->
    <div v-if="!selectedWord && !selectedPhrase && currentDisplayMode === 'word'" class="add-word-fab" @click="showActionSheet = true">
      <van-icon name="plus" size="24" />
    </div>
    <div v-if="!selectedWord && !selectedPhrase && currentDisplayMode === 'word'" class="search-fab" @click="openSearchModal">
      <van-icon name="search" size="22" />
    </div>

    <!-- 操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actionSheetActions"
      cancel-text="取消"
      @select="onActionSheetSelect"
    />

    <!-- 添加单词弹窗 -->
    <AddWordModal
      :show="showAddWordModal"
      :loading="addingWord"
      @close="closeAddWordModal"
      @submit="submitAddWord"
    />

    <!-- 添加短语弹窗 -->
    <AddPhraseModal
      :show="showAddPhraseModal"
      :loading="addingPhrase"
      @close="closeAddPhraseModal"
      @submit="submitAddPhrase"
    />

    <!-- 状态编辑弹窗 -->
    <StatusEditModal
      :show="showStatusModal"
      :word="currentEditWord"
      :editType="currentEditType"
      :loading="updatingStatus"
      @close="closeStatusModal"
      @submit="submitStatusUpdate"
    />

    <!-- 标签编辑弹窗 -->
    <TagEditModal
      :show="showTagModal"
      :word="currentEditWord"
      :selectedTags="tagForm.selectedTags"
      :availableTags="availableTags"
      :loading="updatingTags"
      @close="closeTagModal"
      @submit="submitTagUpdate"
    />

    <!-- 短语编辑弹窗 -->
    <PhraseEditModal
      :show="showPhraseModal"
      :editing="editingPhrase"
      :form="phraseForm"
      @close="closePhraseModal"
      @submit="submitPhrase"
      @delete="deletePhrase"
      @select-image="selectPhraseImage"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getWordList, getWordDetail, generateWordPicture, updateWordPicture, addWord, getWordStatusList, updateWordStatus, getWordTagList, updateWordTag, getWordPhraseList, getWordPhraseDetail, addWordPhrase, updateWordPhrase, deleteWordPhrase, generatePhrasePicture, updatePhrasePicture, importWord } from '@/api/dictionary'
import { getTagList } from '@/api/tag'
import { uploadFile, selectFiles } from '@/api/file'
import { getUserInfo, getUserId, getToken } from '@/utils/auth'
import { getResourceUrl } from '@/utils/request'
import { showToast, closeToast } from 'vant'

// Sub-components
import SearchModal from '@/components/dictionary/SearchModal.vue'
import SearchAddModal from '@/components/dictionary/SearchAddModal.vue'
import ShareGenerateModal from '@/components/dictionary/ShareGenerateModal.vue'
import ShareImportModal from '@/components/dictionary/ShareImportModal.vue'
import WordDetailView from '@/components/dictionary/WordDetailView.vue'
import PhraseDetailView from '@/components/dictionary/PhraseDetailView.vue'
import PictureModal from '@/components/dictionary/PictureModal.vue'
import ImageCropModal from '@/components/dictionary/ImageCropModal.vue'
import ImageSearchModal from '@/components/dictionary/ImageSearchModal.vue'
import AddWordModal from '@/components/dictionary/AddWordModal.vue'
import AddPhraseModal from '@/components/dictionary/AddPhraseModal.vue'
import StatusEditModal from '@/components/dictionary/StatusEditModal.vue'
import TagEditModal from '@/components/dictionary/TagEditModal.vue'
import PhraseEditModal from '@/components/dictionary/PhraseEditModal.vue'

const props = defineProps({
  defaultType: {
    type: String,
    default: 'word'
  }
})


// 路由
const router = useRouter()

// 响应式数据
const initialLoading = ref(true)
const globalLoading = ref(false)
const error = ref('')
const selectedWord = ref(null)
const selectedPhrase = ref(null)
const scrollContainer = ref(null)
const lastScrollTop = ref(0)
const transitionName = ref('page-slide')

// 显示模式切换相关
const resourceType = ref(props.defaultType || 'word')
const currentDisplayMode = ref('word')
const displayModes = computed(() => ([
  { label: resourceType.value === 'word' ? '单词' : '短语', value: 'word' },
  { label: '状态', value: 'status' },
  { label: '标签', value: 'tag' }
]))

// 状态编辑弹窗相关
const showStatusModal = ref(false)
const currentEditWord = ref(null)
const currentEditType = ref('word')
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

// 预设标签数据
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

// 状态、标签、短语数据
const statusWords = ref([])
const tagWords = ref([])
const statusPhrases = ref([])
const tagPhrases = ref([])
const availableTags = ref([])
const loadingStatusData = ref(false)
const loadingTagData = ref(false)

// 短语数据
const phraseList = ref([])
const phrasesByLetter = ref({})
const loadingPhraseData = ref(false)
const hasMorePhrases = ref(true)
const phraseOffset = ref(0)
const loadingMorePhrases = ref(false)

// 按模式选择字母循环
const lettersToLoop = computed(() => {
  const map = resourceType.value === 'phrase' ? phrasesByLetter.value : wordsByLetter.value
  return Object.keys(map)
    .filter(letter => map[letter] && map[letter].length > 0)
    .sort((a, b) => {
      if (a === '#') return 1
      if (b === '#') return -1
      return a.localeCompare(b)
    })
})

// 短语编辑弹窗相关
const showPhraseModal = ref(false)
const editingPhrase = ref(false)
const phraseForm = reactive({
  id: null,
  phrase: '',
  translation: '',
  pronunciation: '',
  example: [],
  picture: '',
  isGeneratePicture: false
})

// 分页配置
const PAGE_SIZE = 50
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

// 添加短语相关
const showAddPhraseModal = ref(false)
const addingPhrase = ref(false)

const showSearchModal = ref(false)
const showActionSheet = ref(false)
const showSearchAddModal = ref(false)
const showShareGenerateModal = ref(false)
const showShareImportModal = ref(false)
const actionSheetActions = computed(() => {
  const actions = [
    { name: resourceType.value === 'word' ? '添加单词' : '添加短语', value: 'add' },
    { name: '导入文件', value: 'import' },
    { name: '中文搜索添加', value: 'search-add' },
    { name: '生成分享码', value: 'share-generate' },
    { name: '使用分享码导入', value: 'share-import' },
  ]
  return actions
})
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
let searchDebounceTimer = null
const searchActive = ref(false)
const searchType = ref('word')

// 图片上传相关
const showCropModal = ref(false)
const selectedImageFile = ref(null)
const selectedImageSrc = ref('')
const uploadingImage = ref(false)
const cropper = ref(null)
const uploadedImagePath = ref('')
const showImageSearchModal = ref(false)
const imageSearchDefaultQuery = ref('')

// 音频播放状态
const audioPlaying = ref({})

// 预加载的音频对象缓存
const audioCache = ref({})

// ========== 工具方法 ==========

const getStatusText = (status) => {
  const statusMap = { 0: '未知', 1: '学习', 2: '复习', 3: '强化', 4: '完成' }
  return statusMap[status] || '未知'
}

const getStatusClass = (status) => {
  const classMap = { 0: 'unknown', 1: 'study', 2: 'review', 3: 'strengthen', 4: 'finish' }
  return classMap[status] || 'unknown'
}

// ========== 分类方法 ==========

const categorizeWordsByLetter = (words) => {
  const categorized = {}
  words.forEach(word => {
    const firstLetter = word.word.charAt(0).toLowerCase()
    if (!categorized[firstLetter]) categorized[firstLetter] = []
    categorized[firstLetter].push(word)
  })
  return categorized
}

const categorizePhrasesByLetter = (phrases) => {
  const categorized = {}
  phrases.forEach(item => {
    const text = item.phrase || item.word || item.content || ''
    const firstLetter = (text.trim().charAt(0) || '#').toLowerCase()
    const letter = /[a-z]/.test(firstLetter) ? firstLetter : '#'
    if (!categorized[letter]) categorized[letter] = []
    categorized[letter].push(item)
  })
  Object.keys(categorized).forEach(k => {
    categorized[k].sort((a, b) => {
      const ta = (a.phrase || a.word || a.content || '').toLowerCase()
      const tb = (b.phrase || b.word || b.content || '').toLowerCase()
      return ta.localeCompare(tb)
    })
  })
  return categorized
}

// ========== 状态/标签关联 ==========

const associateStatusAndTagsToWords = () => {
  const statusMap = {}
  statusWords.value.forEach(item => {
    const wordId = item.word_id ?? item.wordId
    const statusNum = Number(item.status ?? item.state ?? 0)
    if (wordId != null) statusMap[wordId] = statusNum
  })
  const tagMap = {}
  tagWords.value.forEach(item => {
    const wordId = item.word_id ?? item.wordId
    const tags = item.tags || []
    if (wordId != null) tagMap[wordId] = tags
  })
  allWords.value = allWords.value.map(word => ({
    ...word,
    status: statusMap[word.id] !== undefined ? statusMap[word.id] : 0,
    tags: tagMap[word.id] || []
  }))
  wordsByLetter.value = categorizeWordsByLetter(allWords.value)
}

const associateStatusAndTagsToPhrases = () => {
  const statusMap = {}
  statusPhrases.value.forEach(item => {
    const pid = item.word_id ?? item.wordId
    const s = Number(item.status ?? item.state ?? 0)
    if (pid != null) statusMap[pid] = s
  })
  const tagMap = {}
  tagPhrases.value.forEach(item => {
    const pid = item.word_id ?? item.wordId
    const tags = item.tags || []
    if (pid != null) tagMap[pid] = tags
  })
  phraseList.value = phraseList.value.map(p => ({
    ...p,
    status: statusMap[p.id] !== undefined ? statusMap[p.id] : 0,
    tags: tagMap[p.id] || []
  }))
  phrasesByLetter.value = categorizePhrasesByLetter(phraseList.value)
}

// ========== 过滤方法 ==========

const getFilteredWordsForStatus = (letter) => {
  const wordsForLetter = wordsByLetter.value[letter] || []
  const withStatus = []
  const withoutStatus = []
  for (const w of wordsForLetter) {
    if (Number(w.status) > 0) withStatus.push(w)
    else withoutStatus.push(w)
  }
  return [...withStatus, ...withoutStatus]
}

const getFilteredPhrasesForStatus = (letter) => {
  const items = phrasesByLetter.value[letter] || []
  const withStatus = []
  const withoutStatus = []
  items.forEach(item => {
    const s = Number(item.status || 0)
    if (s > 0) withStatus.push(item)
    else withoutStatus.push(item)
  })
  return [...withStatus, ...withoutStatus]
}

// ========== 数据加载 ==========

const loadWords = async (append = false) => {
  if (loadingMore.value || !hasMoreWords.value) return
  try {
    loadingMore.value = true
    const params = { offset: currentOffset.value, limit: PAGE_SIZE, orderby: 'word' }
    const response = await getWordList(params)
    const data = response.data || []
    const total = response.total_count || 0

    if (append) {
      allWords.value = [...allWords.value, ...data]
      currentOffset.value += data.length
    } else {
      allWords.value = data
      currentOffset.value = data.length
    }
    wordsByLetter.value = categorizeWordsByLetter(allWords.value)
    hasMoreWords.value = allWords.value.length < total
  } catch (err) {
    console.error('加载单词失败:', err)
    showToast('加载单词失败，请稍后重试')
  } finally {
    loadingMore.value = false
  }
}

const loadPhrases = async (append = false) => {
  if (append && (loadingMorePhrases.value || !hasMorePhrases.value)) return
  try {
    if (append) {
      loadingMorePhrases.value = true
    } else {
      loadingPhraseData.value = true
      phraseOffset.value = 0
      hasMorePhrases.value = true
    }
    const params = { offset: phraseOffset.value, limit: PAGE_SIZE }
    const resp = await getWordPhraseList(params)
    if (resp.code === 0) {
      const list = resp.data || []
      if (append) {
        phraseList.value = phraseList.value.concat(list)
      } else {
        phraseList.value = list
      }
      phrasesByLetter.value = categorizePhrasesByLetter(phraseList.value)
      phraseOffset.value += list.length
      if (list.length < PAGE_SIZE) hasMorePhrases.value = false
    } else {
      showToast(resp.message || '加载短语列表失败')
    }
  } catch (err) {
    console.error('加载短语失败:', err)
    showToast('网络错误，请稍后重试')
  } finally {
    if (append) loadingMorePhrases.value = false
    else loadingPhraseData.value = false
  }
}

const loadMoreWords = async () => {
  if (!hasMoreWords.value || loadingMore.value) return
  await loadWords(true)
}

const loadMorePhrases = async () => {
  if (!hasMorePhrases.value || loadingMorePhrases.value) return
  await loadPhrases(true)
}

const loadStatusData = async () => {
  try {
    loadingStatusData.value = true
    if (allWords.value.length > 0) {
      const wordIds = allWords.value.map(word => word.id)
      const response = await getWordStatusList(wordIds)
      if (response.code === 0) {
        statusWords.value = response.data || []
        associateStatusAndTagsToWords()
      } else {
        showToast(response.message || '加载状态数据失败')
      }
    } else {
      const response = await getWordStatusList()
      if (response.code === 0) {
        statusWords.value = response.data || []
      } else {
        showToast(response.message || '加载状态数据失败')
      }
    }
  } catch (err) {
    console.error('加载状态数据失败:', err)
    showToast('网络错误，请稍后重试')
  } finally {
    loadingStatusData.value = false
  }
}

const loadTagData = async () => {
  try {
    loadingTagData.value = true
    if (allWords.value.length > 0) {
      const wordIds = allWords.value.map(word => word.id)
      const [wordTagResponse, tagListResponse] = await Promise.all([
        getWordTagList(wordIds),
        getTagList()
      ])
      if (wordTagResponse.code === 0) {
        tagWords.value = wordTagResponse.data || []
        associateStatusAndTagsToWords()
      } else {
        showToast(wordTagResponse.message || '加载单词标签数据失败')
      }
      if (tagListResponse.code === 0) {
        availableTags.value = tagListResponse.data || []
      } else {
        showToast(tagListResponse.message || '加载标签列表失败')
      }
    } else {
      const [wordTagResponse, tagListResponse] = await Promise.all([
        getWordTagList(),
        getTagList()
      ])
      if (wordTagResponse.code === 0) tagWords.value = wordTagResponse.data || []
      else showToast(wordTagResponse.message || '加载单词标签数据失败')
      if (tagListResponse.code === 0) availableTags.value = tagListResponse.data || []
      else showToast(tagListResponse.message || '加载标签列表失败')
    }
  } catch (err) {
    console.error('加载标签数据失败:', err)
    showToast('网络错误，请稍后重试')
  } finally {
    loadingTagData.value = false
  }
}

const loadPhraseStatusData = async () => {
  try {
    loadingStatusData.value = true
    if (phraseList.value.length > 0) {
      const phraseIds = phraseList.value.map(p => p.id)
      const resp = await getWordStatusList(phraseIds, 2)
      if (resp.code === 0) {
        statusPhrases.value = resp.data || []
        associateStatusAndTagsToPhrases()
      }
    }
  } catch (e) {
    console.error('加载短语状态失败:', e)
  } finally {
    loadingStatusData.value = false
  }
}

const loadPhraseTagData = async () => {
  try {
    loadingTagData.value = true
    if (phraseList.value.length > 0) {
      const phraseIds = phraseList.value.map(p => p.id)
      const resp = await getWordTagList(phraseIds, 2)
      if (resp.code === 0) {
        tagPhrases.value = resp.data || []
        associateStatusAndTagsToPhrases()
      }
    }
  } catch (e) {
    console.error('加载短语标签失败:', e)
  } finally {
    loadingTagData.value = false
  }
}

const loadStatusAndTagsByWordIds = async (wordIds, append = false) => {
  try {
    const [statusResponse, tagResponse] = await Promise.all([
      getWordStatusList(wordIds),
      getWordTagList(wordIds)
    ])
    if (statusResponse.code === 0) {
      const statusData = statusResponse.data || []
      if (append) statusWords.value = [...statusWords.value, ...statusData]
      else statusWords.value = statusData
    }
    if (tagResponse.code === 0) {
      const tagData = tagResponse.data || []
      if (append) tagWords.value = [...tagWords.value, ...tagData]
      else tagWords.value = tagData
    }
    associateStatusAndTagsToWords()
  } catch (err) {
    console.error('加载状态和标签数据失败:', err)
    // 失败时显式提示用户, 不再生成假数据 (避免用户对着虚构的状态和标签操作)
    showToast('加载词条状态/标签失败, 请刷新重试')
  }
}

// ========== 模式切换 ==========

const switchDisplayMode = async (mode) => {
  currentDisplayMode.value = mode
  selectedWord.value = null
  selectedPhrase.value = null

  if (mode === 'status') {
    if (resourceType.value === 'word') {
      if (statusWords.value.length === 0) await loadStatusData()
      else associateStatusAndTagsToWords()
    } else {
      if (phraseList.value.length === 0) await loadPhrases()
      await loadPhraseStatusData()
    }
  } else if (mode === 'tag') {
    if (resourceType.value === 'word') {
      if (tagWords.value.length === 0) await loadTagData()
      else associateStatusAndTagsToWords()
    } else {
      if (phraseList.value.length === 0) await loadPhrases()
      await loadPhraseTagData()
    }
  } else if (mode === 'word') {
    if (resourceType.value === 'word') {
      if (allWords.value.length === 0) await initializeWordList()
      else wordsByLetter.value = categorizeWordsByLetter(allWords.value)
    } else {
      if (phraseList.value.length === 0) await loadPhrases()
    }
  }
}

const switchResourceType = async (type) => {
  if (resourceType.value === type) return
  resourceType.value = type
  selectedWord.value = null
  selectedPhrase.value = null
  transitionName.value = 'list-slide'
  if (type === 'word') router.push('/dictionary/words')
  else router.push('/dictionary/phrases')
}

// ========== 初始化 ==========

const initializeWordList = async () => {
  try {
    initialLoading.value = true
    allWords.value = []
    wordsByLetter.value = {}
    currentOffset.value = 0
    hasMoreWords.value = true
    await loadWords()
    await nextTick()
    setupScrollListener()
  } catch (err) {
    // 不要把 err.message 直接吐给用户 (可能含内部路径/接口细节), 详细栈走 console
    console.error('初始化单词列表失败:', err)
    error.value = '网络错误，请稍后重试'
  } finally {
    initialLoading.value = false
  }
}

// 记录已绑定的 (容器节点, handler) 对，确保切换 tab / 卸载组件时能精确 removeEventListener。
// 不要在每次进入都重新创建匿名 handler，否则旧 handler 永远卸不掉、造成累积。
let _scrollHandler = null
let _scrollHandlerNode = null

const detachScrollListener = () => {
  if (_scrollHandler && _scrollHandlerNode) {
    _scrollHandlerNode.removeEventListener('scroll', _scrollHandler)
  }
  _scrollHandler = null
  _scrollHandlerNode = null
}

const setupScrollListener = () => {
  if (!scrollContainer.value) return
  // 先卸掉上一次的，避免重复挂载（initializeWordList / handleAfterEnter 都会调用本函数）
  detachScrollListener()
  const handleScroll = () => {
    const container = scrollContainer.value
    if (!container) return
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    const scrollProgress = (scrollTop + clientHeight) / scrollHeight
    if (scrollProgress > 0.8) {
      if (currentDisplayMode.value === 'word' && resourceType.value === 'word' && hasMoreWords.value && !loadingMore.value) {
        loadMoreWords()
      } else if (currentDisplayMode.value === 'word' && resourceType.value === 'phrase' && hasMorePhrases.value && !loadingMorePhrases.value) {
        loadMorePhrases()
      }
    }
  }
  _scrollHandler = handleScroll
  _scrollHandlerNode = scrollContainer.value
  scrollContainer.value.addEventListener('scroll', handleScroll)
}

onBeforeUnmount(() => {
  detachScrollListener()
})

// ========== 选择/返回 ==========

const preloadAudio = (audioUrl, cacheKey) => {
  if (!audioUrl || audioCache.value[cacheKey]) return Promise.resolve()
  return new Promise((resolve) => {
    try {
      const audio = new Audio(getResourceUrl(audioUrl))
      audio.preload = 'auto'
      audioCache.value[cacheKey] = audio
      audio.addEventListener('canplaythrough', () => resolve(), { once: true })
      audio.addEventListener('error', () => resolve(), { once: true })
    } catch (err) {
      resolve()
    }
  })
}

const preloadImage = (imageUrl) => {
  if (!imageUrl) return Promise.resolve()
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.onload = resolve
      img.onerror = resolve
      img.src = getResourceUrl(imageUrl)
    } catch (err) {
      resolve()
    }
  })
}

const preloadWordResources = async (wordData) => {
  if (!wordData) return
  const preloadPromises = []
  if (wordData.us_audio) preloadPromises.push(preloadAudio(wordData.us_audio, `${wordData.id}_us`))
  if (wordData.uk_audio) preloadPromises.push(preloadAudio(wordData.uk_audio, `${wordData.id}_uk`))
  if (wordData.pos && Array.isArray(wordData.pos)) {
    wordData.pos.forEach(pos => {
      if (pos.picture) preloadPromises.push(preloadImage(pos.picture))
    })
  }
  Promise.allSettled(preloadPromises)
}

const preloadPhraseResources = async (phraseData) => {
  if (!phraseData) return
  const preloadPromises = []
  if (phraseData.pronunciation) preloadPromises.push(preloadAudio(phraseData.pronunciation, `${phraseData.id}_phrase`))
  if (phraseData.picture) preloadPromises.push(preloadImage(phraseData.picture))
  Promise.allSettled(preloadPromises)
}

const selectWord = async (wordId) => {
  try {
    if (scrollContainer.value) lastScrollTop.value = scrollContainer.value.scrollTop
    transitionName.value = 'page-slide'
    const response = await getWordDetail(wordId)
    if (response.code === 0) {
      selectedWord.value = response.data
      showPictures.value = {}
      preloadWordResources(response.data)
      if (showSearchModal.value) {
        searchActive.value = true
        showSearchModal.value = false
      }
    } else {
      showToast(response.message || '获取单词详情失败')
    }
  } catch (err) {
    console.error('获取单词详情失败:', err)
    showToast('网络错误，请稍后重试')
  }
}

const selectPhrase = async (phraseId) => {
  try {
    if (scrollContainer.value) lastScrollTop.value = scrollContainer.value.scrollTop
    transitionName.value = 'page-slide'
    const resp = await getWordPhraseDetail(phraseId)
    if (resp.code === 0 && resp.data) {
      const d = resp.data
      selectedPhrase.value = {
        id: d.id,
        word: d.phrase || '',
        translation: d.translation || '',
        pronunciation: d.pronunciation || '',
        example: Array.isArray(d.example) ? d.example.map(e => ({ example: e.example || '', translation: e.translation || '' })) : [],
        picture: d.picture || ''
      }
      preloadPhraseResources(selectedPhrase.value)
      if (showSearchModal.value) {
        searchActive.value = true
        showSearchModal.value = false
      }
    } else {
      showToast(resp.message || '获取短语详情失败')
    }
  } catch (err) {
    console.error('获取短语详情失败:', err)
    showToast('网络错误，请稍后重试')
  }
}

const goBack = () => {
  selectedWord.value = null
  selectedPhrase.value = null
  nextTick(() => {
    if (scrollContainer.value) scrollContainer.value.scrollTop = lastScrollTop.value || 0
  })
}

// ========== 搜索 ==========

const openSearchModal = () => {
  showSearchModal.value = true
  searchType.value = resourceType.value
}

const closeSearchModal = () => {
  showSearchModal.value = false
  searchActive.value = false
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  searchQuery.value = ''
  searchResults.value = []
  searching.value = false
}

const selectSearchResult = (item) => {
  if (searchType.value === 'word') selectWord(item.id)
  else selectPhrase(item.id)
}

// ========== 过渡钩子 ==========

const handleAfterEnter = (el) => {
  if (!el) return
  if (el.classList && el.classList.contains('alphabetical-word-list')) {
    scrollContainer.value = el
    el.scrollTop = lastScrollTop.value || 0
  }
}

// ========== 滑动手势 ==========

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
  if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0) handleRightSwipe()
    else if (deltaX < 0) handleLeftSwipe()
  }
}

const handleRightSwipe = () => {
  if (selectedWord.value || selectedPhrase.value) {
    transitionName.value = 'page-slide-right'
    goBack()
    if (searchActive.value) showSearchModal.value = true
    nextTick(() => {
      if (scrollContainer.value) scrollContainer.value.scrollTop = lastScrollTop.value || 0
    })
    return
  }
  const modes = displayModes.value.map(m => m.value)
  const currentIndex = modes.indexOf(currentDisplayMode.value)
  const prevIndex = (currentIndex - 1 + modes.length) % modes.length
  switchDisplayMode(modes[prevIndex])
}

const handleLeftSwipe = () => {
  if (!selectedWord.value && !selectedPhrase.value) {
    const modes = displayModes.value.map(m => m.value)
    const currentIndex = modes.indexOf(currentDisplayMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    switchDisplayMode(modes[nextIndex])
  }
}

// ========== 音频播放 ==========

const playAudio = (audioUrl, index = 'default') => {
  if (audioPlaying.value[index]) return
  try {
    audioPlaying.value[index] = true
    const currentId = selectedWord.value?.id || selectedPhrase.value?.id
    const cacheKey = `${currentId}_${index}`
    let audio = audioCache.value[cacheKey]
    if (!audio) {
      audio = new Audio(getResourceUrl(audioUrl))
    }
    audio.currentTime = 0
    // 用 { once: true } 保证 listener 只触发一次后自动清理, 避免 cached audio 多次播放后 listener 累积
    const handleEnded = () => { audioPlaying.value[index] = false }
    const handleError = () => { audioPlaying.value[index] = false }
    audio.addEventListener('ended', handleEnded, { once: true })
    audio.addEventListener('error', handleError, { once: true })
    audio.play().catch(err => {
      console.error('音频播放失败:', err)
      audioPlaying.value[index] = false
      showToast('音频播放失败')
    })
  } catch (err) {
    console.error('音频播放失败:', err)
    audioPlaying.value[index] = false
    showToast('音频播放失败')
  }
}

// ========== 图片弹窗 ==========

const openPictureModal = (index) => {
  const pos = selectedWord.value.pos[index]
  currentPosIndex.value = index
  currentPicture.value = pos.picture || ''
  originalPicture.value = pos.picture || ''
  generatedPicture.value = ''
  showPictureModal.value = true
}

const openPhrasePictureModal = () => {
  currentPosIndex.value = -1
  currentPicture.value = selectedPhrase.value?.picture || ''
  originalPicture.value = selectedPhrase.value?.picture || ''
  generatedPicture.value = ''
  showActionModal.value = false
  showPictureModal.value = true
}

const closePictureModal = () => {
  showPictureModal.value = false
  showActionModal.value = false
  setTimeout(() => {
    generatedPicture.value = ''
    currentPicture.value = ''
    originalPicture.value = ''
    currentPosIndex.value = -1
  }, 300)
}

const generatePicture = async () => {
  try {
    generatingPicture.value = true
    if (selectedWord.value && currentPosIndex.value >= 0) {
      const pos = selectedWord.value.pos[currentPosIndex.value]
      const response = await generateWordPicture(pos.id)
      if (response.link) {
        generatedPicture.value = response.link
        currentPicture.value = response.link
        showActionModal.value = true
        showToast('图片生成成功')
      } else {
        showToast('生成失败, 未返回图片链接')
      }
    } else if (selectedPhrase.value) {
      const response = await generatePhrasePicture(selectedPhrase.value.id)
      if (response.link) {
        generatedPicture.value = response.link
        currentPicture.value = response.link
        showActionModal.value = true
        showToast('图片生成成功')
      } else {
        showToast('生成失败, 未返回图片链接')
      }
    }
  } catch (err) {
    console.error('生成图片失败:', err)
    showToast(`生成图片失败: ${err?.response?.data?.message || err?.message || '请稍后重试'}`)
  } finally {
    generatingPicture.value = false
  }
}

const applyPicture = async () => {
  try {
    applyingPicture.value = true
    if (selectedWord.value && currentPosIndex.value >= 0) {
      const pos = selectedWord.value.pos[currentPosIndex.value]
      await updateWordPicture({ word_pos_id: pos.id, picture: generatedPicture.value })
      selectedWord.value.pos[currentPosIndex.value].picture = generatedPicture.value
      currentPicture.value = generatedPicture.value
      originalPicture.value = generatedPicture.value
      showToast('图片应用成功')
      showActionModal.value = false
    } else if (selectedPhrase.value) {
      await updatePhrasePicture({ id: selectedPhrase.value.id, link: generatedPicture.value })
      selectedPhrase.value.picture = generatedPicture.value
      currentPicture.value = generatedPicture.value
      originalPicture.value = generatedPicture.value
      showToast('图片应用成功')
      showActionModal.value = false
    }
  } catch (err) {
    console.error('应用图片失败:', err)
    showToast(`应用图片失败: ${err?.response?.data?.message || err?.message || '请稍后重试'}`)
  } finally {
    applyingPicture.value = false
  }
}

const restorePicture = () => {
  generatedPicture.value = ''
  currentPicture.value = originalPicture.value
  showActionModal.value = false
  showToast('已恢复原图片')
}

// ========== 图片上传 ==========

const generateUploadPath = (word, pos, fileExtension = 'png') => {
  const userId = getUserId() || getUserInfo()?.id || 'unknown'
  const timestamp = Math.floor(Date.now() / 1000)
  return `picture/user_word_${userId}/${word}/${pos}_${timestamp}.${fileExtension}`
}

const selectImageFile = (accept = 'image/*') => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = false
    input.onchange = (event) => {
      const files = event.target.files
      if (files && files.length > 0) {
        const file = files[0]
        if (accept === 'image/*') {
          if (!file.type.startsWith('image/')) { reject(new Error('请选择图片文件')); return }
        }
        if (file.size > 10 * 1024 * 1024) { reject(new Error('文件大小不能超过10MB')); return }
        resolve(file)
      } else {
        reject(new Error('未选择文件'))
      }
    }
    input.oncancel = () => reject(new Error('用户取消选择'))
    input.click()
  })
}

// ========== 搜索图片 ==========
const openImageSearch = () => {
  // 默认搜索词：当前单词或短语
  if (selectedWord.value) {
    imageSearchDefaultQuery.value = selectedWord.value.word || ''
  } else if (selectedPhrase.value) {
    imageSearchDefaultQuery.value = selectedPhrase.value.word || ''
  } else {
    imageSearchDefaultQuery.value = ''
  }
  showImageSearchModal.value = true
}

// 当前在飞的图搜代理 fetch, 切卡 / 关弹窗时 abort, 避免旧响应贴到新卡
let imageSearchAbort = null

const onImageSearchSelect = async (imageUrl) => {
  showImageSearchModal.value = false
  // 抓快照: 当前编辑的是单词还是短语 / 哪个 pos, 用于 await 后判断 selection 是否仍在
  const snapshotWordId = selectedWord.value?.id || null
  const snapshotPhraseId = selectedPhrase.value?.id || null
  const snapshotPosIndex = currentPosIndex.value
  if (imageSearchAbort) imageSearchAbort.abort()
  imageSearchAbort = new AbortController()
  const ac = imageSearchAbort

  showToast({ message: '正在加载图片...', type: 'loading', duration: 0, forbidClick: true })
  try {
    const proxyUrl = `/api/v1/file-service/proxy-image?url=${encodeURIComponent(imageUrl)}`
    const response = await fetch(proxyUrl, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
      signal: ac.signal,
    })
    if (!response.ok) throw new Error(`proxy 返回 ${response.status}`)
    const blob = await response.blob()
    // 用户切到别的词或别的 pos 了, 丢弃结果
    if ((snapshotWordId !== (selectedWord.value?.id || null))
      || (snapshotPhraseId !== (selectedPhrase.value?.id || null))
      || (snapshotPosIndex !== currentPosIndex.value)) {
      closeToast()
      return
    }
    if (!blob.type.startsWith('image/')) throw new Error(`非图片响应: ${blob.type}`)
    const ext = blob.type.split('/')[1] || 'png'
    selectedImageFile.value = new File([blob], `search_image.${ext}`, { type: blob.type })
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedImageSrc.value = e.target.result
      showCropModal.value = true
      closeToast()
      showToast({ message: '请裁剪图片', type: 'success' })
    }
    reader.onerror = () => {
      closeToast()
      showToast('图片读取失败, 请重试')
    }
    reader.readAsDataURL(blob)
  } catch (err) {
    if (err?.name === 'AbortError') return
    console.error('加载搜索图片失败:', err)
    closeToast()
    showToast('图片加载失败，请重试')
  } finally {
    if (imageSearchAbort === ac) imageSearchAbort = null
  }
}

const openImageUpload = async () => {
  try {
    const file = await selectImageFile()
    selectedImageFile.value = file
    const reader = new FileReader()
    reader.onerror = () => showToast('图片读取失败, 请重试')
    reader.onload = (e) => {
      selectedImageSrc.value = e.target.result
      showCropModal.value = true
    }
    reader.readAsDataURL(file)
  } catch (err) {
    if (err.message !== '用户取消选择') showToast(err.message)
  }
}

const closeCropModal = () => {
  showCropModal.value = false
  selectedImageFile.value = null
  selectedImageSrc.value = ''
  uploadedImagePath.value = ''
}

const confirmCrop = async (cropperInstance) => {
  if (!cropperInstance || !selectedImageFile.value) {
    showToast('请先选择图片')
    return
  }
  try {
    uploadingImage.value = true
    const blob = await new Promise((resolve, reject) => {
      try {
        cropperInstance.getCropBlob((data) => resolve(data))
      } catch (err) {
        reject(err)
      }
    })
    const originalExtension = selectedImageFile.value.name.split('.').pop().toLowerCase()
    const croppedFile = new File([blob], `cropped_image.${originalExtension}`, {
      type: `image/${originalExtension}`
    })
    let uploadPath = ''
    if (selectedWord.value && currentPosIndex.value >= 0) {
      const pos = selectedWord.value.pos[currentPosIndex.value]
      uploadPath = generateUploadPath(selectedWord.value.word, pos.pos, originalExtension)
    } else if (selectedPhrase.value) {
      const safePhrase = (selectedPhrase.value.word || 'phrase').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
      uploadPath = `dictionary/phrase/${safePhrase}_${Date.now()}.${originalExtension}`
    }
    const uploadResult = await uploadFile(croppedFile, 'englishstudy', uploadPath)
    if (uploadResult.code === 0 && uploadResult.path) {
      uploadedImagePath.value = uploadResult.path
      closeCropModal()
      generatedPicture.value = uploadResult.path
      currentPicture.value = uploadResult.path
      showActionModal.value = true
      showToast('图片上传成功，请确认是否应用')
    } else {
      throw new Error(uploadResult.message || '上传失败')
    }
  } catch (err) {
    console.error('图片上传失败:', err)
    showToast(err.message || '图片上传失败')
  } finally {
    uploadingImage.value = false
  }
}

// ========== 添加单词 ==========

// ========== 操作菜单 ==========
const onActionSheetSelect = (action) => {
  showActionSheet.value = false
  if (action.value === 'add') {
    if (resourceType.value === 'word') {
      openAddWordModal()
    } else {
      openAddPhraseModal()
    }
  } else if (action.value === 'import') {
    handleImportFile()
  } else if (action.value === 'search-add') {
    showSearchAddModal.value = true
  } else if (action.value === 'share-generate') {
    showShareGenerateModal.value = true
  } else if (action.value === 'share-import') {
    showShareImportModal.value = true
  }
}

const handleImportFile = async () => {
  try {
    const files = await selectImageFile('text/*,.txt,.csv')
    const file = files
    if (!file) return
    showToast({ message: '正在上传文件...', type: 'loading', duration: 0 })
    const object = `import/${Date.now()}_${file.name}`
    const uploadResult = await uploadFile(file, 'englishstudy', object)
    if (uploadResult.code === 0 && uploadResult.path) {
      const resp = await importWord(uploadResult.path, file.name)
      if (resp.code === 0) {
        showToast({ message: '导入任务已创建，可在"我的"页面查看进度', type: 'success', duration: 3000 })
      } else {
        showToast(resp.message || '创建导入任务失败')
      }
    } else {
      showToast(uploadResult.message || '文件上传失败')
    }
  } catch (err) {
    if (err.message !== '用户取消选择') {
      showToast(err.message || '导入失败')
    }
  }
}

const openAddWordModal = () => {
  showAddWordModal.value = true
}

const closeAddWordModal = () => {
  showAddWordModal.value = false
}

const submitAddWord = async (formData) => {
  if (!formData.word.trim()) {
    showToast('请输入单词')
    return
  }
  try {
    addingWord.value = true
    await addWord({
      word: formData.word.trim(),
      is_generate_picture: formData.isGeneratePicture
    })
    showToast('单词添加成功')
    closeAddWordModal()
    await initializeWordList()
  } catch (err) {
    console.error('添加单词失败:', err)
  } finally {
    addingWord.value = false
  }
}

// ========== 添加短语 ==========

const openAddPhraseModal = () => {
  showAddPhraseModal.value = true
}

const closeAddPhraseModal = () => {
  showAddPhraseModal.value = false
}

const submitAddPhrase = async (formData) => {
  if (!formData.phrase.trim()) {
    showToast('请输入短语')
    return
  }
  try {
    addingPhrase.value = true
    const resp = await addWordPhrase({
      phrase: formData.phrase.trim(),
      is_generate_picture: formData.isGeneratePicture
    })
    if (resp.code === 0) {
      showToast('短语添加成功')
      closeAddPhraseModal()
      await loadPhrases(false)
    } else {
      showToast(resp.message || '添加失败，请重试')
    }
  } catch (err) {
    console.error('添加短语失败:', err)
  } finally {
    addingPhrase.value = false
  }
}

// ========== 状态编辑 ==========

const openStatusModal = (word) => {
  currentEditWord.value = word
  currentEditType.value = resourceType.value
  statusForm.status = word.status > 0 ? word.status.toString() : '1'
  showStatusModal.value = true
}

const closeStatusModal = () => {
  showStatusModal.value = false
  currentEditWord.value = null
  statusForm.status = '1'
}

const submitStatusUpdate = async (formData) => {
  if (!currentEditWord.value) return
  try {
    updatingStatus.value = true
    const targetId = currentEditWord.value.id
    const typeNum = currentEditType.value === 'phrase' ? 2 : 1
    const response = await updateWordStatus({
      word_id: targetId,
      status: parseInt(formData.status),
      word_type: typeNum
    })
    if (response.code === 0) {
      // Update local data
      if (currentEditType.value === 'word') {
        const wordIndex = allWords.value.findIndex(w => w.id === targetId)
        if (wordIndex !== -1) {
          allWords.value[wordIndex].status = parseInt(formData.status)
          wordsByLetter.value = categorizeWordsByLetter(allWords.value)
        }
        const statusIndex = statusWords.value.findIndex(w => (w.word_id ?? w.wordId) === targetId)
        if (statusIndex !== -1) statusWords.value[statusIndex].status = parseInt(formData.status)
      } else {
        const phraseIndex = phraseList.value.findIndex(p => p.id === targetId)
        if (phraseIndex !== -1) {
          phraseList.value[phraseIndex].status = parseInt(formData.status)
          phrasesByLetter.value = categorizePhrasesByLetter(phraseList.value)
        }
        const statusIndex = statusPhrases.value.findIndex(p => (p.word_id ?? p.wordId) === targetId)
        if (statusIndex !== -1) statusPhrases.value[statusIndex].status = parseInt(formData.status)
      }

      // Refresh from server
      try {
        const refreshResp = await getWordStatusList(targetId, typeNum)
        if (refreshResp.code === 0) {
          const refreshed = (refreshResp.data || []).find(item => (item.word_id ?? item.wordId) === targetId)
          if (refreshed) {
            const refreshedStatus = Number(refreshed.status ?? refreshed.state ?? 0)
            if (currentEditType.value === 'word') {
              const idx = allWords.value.findIndex(w => w.id === targetId)
              if (idx !== -1) allWords.value[idx].status = refreshedStatus
              const sIdx = statusWords.value.findIndex(w => (w.word_id ?? w.wordId) === targetId)
              if (sIdx !== -1) statusWords.value[sIdx] = { ...statusWords.value[sIdx], status: refreshedStatus }
              else statusWords.value.push({ word_id: targetId, status: refreshedStatus })
              associateStatusAndTagsToWords()
            } else {
              const pIdx = phraseList.value.findIndex(p => p.id === targetId)
              if (pIdx !== -1) phraseList.value[pIdx].status = refreshedStatus
              const spIdx = statusPhrases.value.findIndex(p => (p.word_id ?? p.wordId) === targetId)
              if (spIdx !== -1) statusPhrases.value[spIdx] = { ...statusPhrases.value[spIdx], status: refreshedStatus }
              else statusPhrases.value.push({ word_id: targetId, status: refreshedStatus })
              associateStatusAndTagsToPhrases()
            }
          }
        }
      } catch (e) {
        console.warn('刷新状态失败，使用本地更新值:', e)
      }

      showToast('状态更新成功')
      closeStatusModal()
    } else {
      showToast(response.message || '更新失败，请重试')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
    showToast('网络错误，请稍后重试')
  } finally {
    updatingStatus.value = false
  }
}

// ========== 标签编辑 ==========

const openTagModal = async (word) => {
  currentEditWord.value = word
  currentEditType.value = resourceType.value
  tagForm.selectedTags = [...(word.tags || [])]
  if (availableTags.value.length === 0) {
    try {
      const response = await getTagList()
      if (response.code === 0) availableTags.value = response.data || []
    } catch (err) {
      console.error('加载标签列表失败:', err)
    }
  }
  showTagModal.value = true
}

const closeTagModal = () => {
  showTagModal.value = false
  currentEditWord.value = null
  tagForm.selectedTags = []
}

const submitTagUpdate = async (selectedTags) => {
  if (!currentEditWord.value) return
  try {
    updatingTags.value = true
    const targetId = currentEditWord.value.id
    const typeNum = currentEditType.value === 'phrase' ? 2 : 1
    const response = await updateWordTag({
      word_id: targetId,
      tags: selectedTags.map(tag => tag.id),
      word_type: typeNum
    })
    if (response.code === 0) {
      if (currentEditType.value === 'word') {
        const wordIndex = allWords.value.findIndex(w => w.id === targetId)
        if (wordIndex !== -1) {
          allWords.value[wordIndex].tags = [...selectedTags]
          wordsByLetter.value = categorizeWordsByLetter(allWords.value)
        }
        if (currentDisplayMode.value === 'tag') {
          const tagIndex = tagWords.value.findIndex(w => (w.word_id ?? w.wordId) === targetId || w.id === targetId)
          if (tagIndex !== -1) tagWords.value[tagIndex].tags = [...selectedTags]
        }
        associateStatusAndTagsToWords()
      } else {
        const phraseIndex = phraseList.value.findIndex(p => p.id === targetId)
        if (phraseIndex !== -1) {
          phraseList.value[phraseIndex].tags = [...selectedTags]
          phrasesByLetter.value = categorizePhrasesByLetter(phraseList.value)
        }
        if (currentDisplayMode.value === 'tag') {
          const tagIndex = tagPhrases.value.findIndex(p => (p.word_id ?? p.wordId) === targetId)
          if (tagIndex !== -1) tagPhrases.value[tagIndex].tags = [...selectedTags]
        }
        associateStatusAndTagsToPhrases()
      }
      showToast('标签更新成功')
      closeTagModal()
    } else {
      showToast(response.message || '更新失败，请重试')
    }
  } catch (err) {
    console.error('更新标签失败:', err)
    showToast('网络错误，请稍后重试')
  } finally {
    updatingTags.value = false
  }
}

// ========== 短语编辑 ==========

const openPhraseModal = async (item) => {
  try {
    phraseForm.id = null
    phraseForm.phrase = ''
    phraseForm.translation = ''
    phraseForm.pronunciation = ''
    phraseForm.example = []
    phraseForm.picture = ''
    phraseForm.isGeneratePicture = false
    editingPhrase.value = !!(item && item.id)

    if (editingPhrase.value) {
      const resp = await getWordPhraseDetail(item.id)
      if (resp.code === 0 && resp.data) {
        const d = resp.data
        phraseForm.id = d.id
        phraseForm.phrase = d.phrase || item.word || ''
        phraseForm.translation = d.translation || ''
        phraseForm.pronunciation = d.pronunciation || ''
        phraseForm.example = Array.isArray(d.example) ? d.example.map(e => ({ example: e.example || '', translation: e.translation || '' })) : []
        phraseForm.picture = d.picture || ''
      } else {
        showToast(resp.message || '获取短语详情失败')
        return
      }
    }
    showPhraseModal.value = true
  } catch (err) {
    console.error('打开短语弹窗失败:', err)
    showToast('网络错误，请稍后重试')
  }
}

const closePhraseModal = () => {
  showPhraseModal.value = false
  editingPhrase.value = false
}

const selectPhraseImage = async () => {
  try {
    const files = await selectFiles('image/*', false)
    const file = files[0]
    if (!file) { showToast('请先选择图片'); return }
    if (!file.type.startsWith('image/')) { showToast('请选择图片文件'); return }
    if (file.size > 5 * 1024 * 1024) { showToast('图片大小不能超过5MB'); return }
    const ext = file.name.split('.').pop().toLowerCase() || 'png'
    const safePhrase = (phraseForm.phrase || 'phrase').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
    const object = `dictionary/phrase/${safePhrase}_${Date.now()}.${ext}`
    const uploadResult = await uploadFile(file, 'englishstudy', object)
    if (uploadResult.code === 0 && uploadResult.path) {
      phraseForm.picture = uploadResult.path
      showToast('图片上传成功')
    } else {
      showToast(uploadResult.message || '图片上传失败')
    }
  } catch (err) {
    console.error('短语图片上传失败:', err)
    showToast(err.message || '图片上传失败')
  }
}

const submitPhrase = async (formData) => {
  const payload = {
    phrase: (formData.phrase || '').trim(),
    translation: (formData.translation || '').trim(),
    pronunciation: (formData.pronunciation || '').trim(),
    example: (formData.example || []).map(e => ({ example: e.example || '', translation: e.translation || '' })),
    picture: formData.picture || ''
  }
  if (!payload.phrase) { showToast('请输入短语'); return }

  try {
    if (editingPhrase.value) {
      const resp = await updateWordPhrase({ id: formData.id, ...payload })
      if (resp.code === 0) {
        const idx = phraseList.value.findIndex(p => p.id === formData.id)
        if (idx !== -1) {
          phraseList.value[idx] = { ...phraseList.value[idx], word: payload.phrase }
          phrasesByLetter.value = categorizePhrasesByLetter(phraseList.value)
        }
        showToast('短语更新成功')
        closePhraseModal()
      } else {
        showToast(resp.message || '更新失败，请重试')
      }
    } else {
      const resp = await addWordPhrase({ ...payload, is_generate_picture: !!formData.isGeneratePicture })
      if (resp.code === 0) {
        showToast('短语添加成功')
        await loadPhrases(false)
        closePhraseModal()
      } else {
        showToast(resp.message || '添加失败，请重试')
      }
    }
  } catch (err) {
    console.error('提交短语失败:', err)
    showToast('网络错误，请稍后重试')
  }
}

const deletePhrase = async () => {
  if (!editingPhrase.value || !phraseForm.id) return
  try {
    const resp = await deleteWordPhrase({ id: phraseForm.id })
    if (resp.code === 0) {
      const idx = phraseList.value.findIndex(p => p.id === phraseForm.id)
      if (idx !== -1) {
        phraseList.value.splice(idx, 1)
        phrasesByLetter.value = categorizePhrasesByLetter(phraseList.value)
      }
      showToast('短语已删除')
      closePhraseModal()
    } else {
      showToast(resp.message || '删除失败，请重试')
    }
  } catch (err) {
    console.error('删除短语失败:', err)
    showToast('网络错误，请稍后重试')
  }
}

// ========== 初始化 ==========

onMounted(async () => {
  console.log('Dictionary 组件已挂载，开始初始化...')
  try {
    if (resourceType.value === 'word') {
      await initializeWordList()
    } else {
      initialLoading.value = true
      await loadPhrases(false)
      await nextTick()
      setupScrollListener()
      initialLoading.value = false
    }
  } catch (err) {
    console.error('初始化失败:', err)
    error.value = '初始化失败, 请下拉刷新或重新登录'
    initialLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.dictionary-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;

  &::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
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
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
    pointer-events: none;
  }

  .page-title {
    font-size: 28px; font-weight: 800; margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: 1px; position: relative; z-index: 1;
  }

  .page-subtitle {
    font-size: 14px; opacity: 0.9; letter-spacing: 0.5px;
    position: relative; z-index: 1;
  }
}

.dictionary-content {
  padding: 32px 20px 40px;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 20px;
  margin: 10px;
}

.alphabetical-word-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding-bottom: 24px;
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 400px;
  will-change: transform, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.letter-group { margin-bottom: 20px; position: relative; }

/* 添加单词浮动按钮 */
.add-word-fab {
  position: fixed; bottom: 80px; right: 20px;
  width: 56px; height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  cursor: pointer; transition: all 0.3s ease; z-index: 1000;

  &:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6); }
  &:active { transform: scale(0.95); }
  .van-icon { color: white; font-weight: bold; }
}

.search-fab {
  position: fixed; bottom: 140px; right: 20px;
  width: 56px; height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  cursor: pointer; transition: all 0.3s ease; z-index: 1000; color: #fff;
}
.search-fab:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6); }
.search-fab:active { transform: scale(0.95); }

/* 字母标签样式 - 通讯录风格 */
.letter-tag {
  position: absolute; top: 8px; left: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white; width: 36px; height: 36px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800; z-index: 10;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.letter-words {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px; padding-top: 12px; position: relative;
  border: 1px solid rgba(102, 126, 234, 0.1);

  &::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(45deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
    pointer-events: none;
  }
}

.word-item {
  border-bottom: 1px solid rgba(102, 126, 234, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 48px; position: relative; overflow: hidden;

  &::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    transform: translateX(-100%); transition: transform 0.3s ease;
  }
}

.word-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  border-left: 3px solid rgba(102, 126, 234, 0.3);
  &::before { transform: translateX(0); }
}

.word-item:last-child { border-bottom: none; }

.global-loading {
  text-align: center; padding: 32px;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.1);
  margin-top: 24px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.van-loading {
  display: flex; justify-content: center; align-items: center;
  min-height: 200px; background: white; border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.van-empty {
  background: white; border-radius: 16px; padding: 40px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}


/* 页面切换动画样式 */
.page-slide-enter-active { transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1); }
.page-slide-leave-active { transition: all 0.25s cubic-bezier(0.55, 0.085, 0.68, 0.53); }
.page-slide-enter-from { transform: translateX(100%); opacity: 0; filter: blur(2px); }
.page-slide-leave-to { transform: translateX(-100%); opacity: 0; filter: blur(2px); }
.page-slide-enter-to, .page-slide-leave-from { transform: translateX(0); opacity: 1; filter: blur(0); }

.page-slide-right-enter-active { transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1); }
.page-slide-right-leave-active { transition: all 0.25s cubic-bezier(0.55, 0.085, 0.68, 0.53); }
.page-slide-right-enter-from { transform: translateX(-100%); opacity: 0; filter: blur(2px); }
.page-slide-right-leave-to { transform: translateX(100%); opacity: 0; filter: blur(2px); }
.page-slide-right-enter-to, .page-slide-right-leave-from { transform: translateX(0); opacity: 1; filter: blur(0); }

.page-slide-left-enter-active { transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1); }
.page-slide-left-leave-active { transition: all 0.25s cubic-bezier(0.55, 0.085, 0.68, 0.53); }
.page-slide-left-enter-from { transform: translateX(100%); opacity: 0; filter: blur(2px); }
.page-slide-left-leave-to { transform: translateX(-100%); opacity: 0; filter: blur(2px); }
.page-slide-left-enter-to, .page-slide-left-leave-from { transform: translateX(0); opacity: 1; filter: blur(0); }

.page-slide-enter-active .alphabetical-word-list,
.page-slide-enter-active .word-detail { box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); }
.page-slide-leave-active .alphabetical-word-list,
.page-slide-leave-active .word-detail { box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05); }

/* 显示模式切换栏样式 */
.header-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.header-text { flex: 1; }

.display-mode-switcher {
  display: flex;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px; padding: 4px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);

  .mode-option {
    padding: 8px 16px; border-radius: 16px; font-size: 14px;
    font-weight: 600; cursor: pointer; transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.8); white-space: nowrap;

    &.active {
      background: rgba(255, 255, 255, 0.25); color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    &:hover:not(.active) { background: rgba(255, 255, 255, 0.1); color: white; }
  }
}

/* 状态和标签模式的单词项样式 */
.word-item {
  &.clickable {
    cursor: pointer; transition: background-color 0.2s ease;
    &:hover { background-color: #f5f5f5; }
    &:active { background-color: #e8e8e8; }
  }

  .van-cell__title {
    color: #1f2937; font-weight: 600; text-shadow: none;
    -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  }

  &.status-mode, &.tag-mode {
    .word-main { display: flex; justify-content: space-between; align-items: center; }
    .word-text { font-weight: 600; color: #2c3e50; }

    .status-indicator {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 12px; border-radius: 20px; transition: all 0.3s ease;
      white-space: nowrap; margin-right: 22px; transform: translateX(-6px);

      .status-dot {
        width: 10px; height: 10px; border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;
      }
      .status-text { font-size: 13px; font-weight: 600; letter-spacing: 0.3px; transition: all 0.3s ease; }

      &.unknown {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 1px solid #dee2e6;
        .status-dot { background: linear-gradient(135deg, #6c757d 0%, #495057 100%); }
        .status-text { color: #6c757d; }
      }
      &.study {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border: 1px solid #90caf9;
        .status-dot { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3); }
        .status-text { color: #1565c0; }
      }
      &.review {
        background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border: 1px solid #ffcc02;
        .status-dot { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3); }
        .status-text { color: #e65100; }
      }
      &.strengthen {
        background: linear-gradient(135deg, #fbe9e7 0%, #ffccbc 100%); border: 1px solid #ff8a65;
        .status-dot { background: linear-gradient(135deg, #ff5722 0%, #d84315 100%); box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3); }
        .status-text { color: #bf360c; }
      }
      &.finish {
        background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); border: 1px solid #81c784;
        .status-dot { background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3); }
        .status-text { color: #2e7d32; }
      }
      &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); .status-dot { transform: scale(1.1); } }
    }

    .word-tags {
      display: flex; flex-wrap: wrap; gap: 6px;
      .tag-item { padding: 4px 8px; border-radius: 12px; font-size: 12px; color: white; font-weight: 500; white-space: nowrap; }
    }

    :deep(.van-cell__value) {
      display: flex; justify-content: flex-end; align-items: center;
      overflow: visible; padding-right: 18px;
    }
    .word-item.status-mode { overflow: visible; padding-right: 8px; }
    :deep(.van-cell) { overflow: visible; }
  }
}

/* 右侧书签切换 */
.resource-switcher {
  position: fixed; right: 10px; top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; align-items: flex-end;
  gap: 10px; z-index: 1000;
}

.bookmark-option {
  min-width: 72px; padding: 10px 14px;
  border-top-left-radius: 12px; border-bottom-left-radius: 12px;
  border-top-right-radius: 0; border-bottom-right-radius: 0;
  background: rgba(0, 0, 0, 0.28); color: #fff;
  font-weight: 600; letter-spacing: 0.3px; text-align: center;
  cursor: pointer; backdrop-filter: blur(6px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  transition: all 0.25s ease; opacity: 0.85; user-select: none;

  &:hover { opacity: 0.95; transform: translateX(-2px); }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 10px 26px rgba(102, 126, 234, 0.35); opacity: 1;
  }
}

@media (max-width: 375px) {
  .bookmark-option { min-width: 64px; padding: 8px 12px; font-size: 12px; }
}

.search-modal { background: #fff; border-radius: 16px; }
.search-modal .modal-header { display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid #eee; }
.search-modal .close-btn { font-size:20px; color:#999; }
.search-modal .modal-content { padding:16px; }
.search-results { margin-top:12px; }
</style>
