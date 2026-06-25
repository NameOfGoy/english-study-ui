<template>
  <div class="dictionary-page" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <!-- 头部 — 压缩成一条简短的品牌标题条 -->
    <div class="dictionary-header">
      <div class="header-glow" aria-hidden="true"></div>
      <div class="header-bar">
        <span class="page-eyebrow">English&nbsp;Study</span>
        <h1 class="page-title">英语<span class="accent">词典</span></h1>
      </div>
    </div>

    <!-- 常显搜索栏 + 视图下划线 Tab (仅列表页显示, 进入详情后隐藏) -->
    <div v-if="!selectedWord && !selectedPhrase" class="dictionary-toolbar">
      <!-- 搜索栏: 左侧嵌 词/短语 切换, 右侧前缀搜索框 -->
      <div class="search-bar">
        <div
          class="resource-toggle"
          :class="{ phrase: resourceType === 'phrase' }"
          @click="toggleResourceType"
        >
          <span class="rt-label">{{ resourceType === 'phrase' ? '短语' : '词' }}</span>
          <van-icon name="arrow-down" class="rt-caret" />
        </div>
        <div class="search-field">
          <van-icon name="search" class="sf-icon" />
          <input
            v-model="keyword"
            class="sf-input"
            type="search"
            :placeholder="resourceType === 'phrase' ? '搜索短语' : '搜索单词'"
            @input="onKeywordInput"
          />
          <van-icon v-if="keyword" name="clear" class="sf-clear" @click="clearKeyword" />
        </div>
      </div>

      <!-- 视图下划线 Tab + 多选入口 -->
      <div class="view-tabs">
        <div class="view-tabs-track">
          <div
            v-for="mode in displayModes"
            :key="mode.value"
            class="view-tab"
            :class="{ active: currentDisplayMode === mode.value }"
            @click="switchDisplayMode(mode.value)"
          >
            <span class="vt-label">{{ mode.label }}</span>
            <span class="vt-underline" aria-hidden="true"></span>
          </div>
        </div>
        <div
          class="select-toggle"
          :class="{ active: selectMode }"
          @click="toggleSelectMode"
        >{{ selectMode ? '取消' : '多选' }}</div>
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

        <!-- 标签模式: 多标签筛选(同时拥有所选全部标签的词语). 搜索态下隐藏, 避免两套筛选冲突 -->
        <div v-if="currentDisplayMode === 'tag' && !hasKeyword" class="tag-filter-panel">
          <div class="tfp-header" @click="showTagFilter = !showTagFilter">
            <span class="tfp-title">
              <van-icon name="filter-o" /> 按标签筛选
              <span class="tfp-summary">{{ selectedFilterTags.length ? `已选 ${selectedFilterTags.length} 个 · ${filteredCount} 条` : '全部' }}</span>
            </span>
            <span class="tfp-right">
              <span v-if="selectedFilterTags.length" class="tfp-clear" @click.stop="selectedFilterTags = []">清空</span>
              <van-icon :name="showTagFilter ? 'arrow-up' : 'arrow-down'" />
            </span>
          </div>
          <div v-show="showTagFilter" class="tfp-body">
            <div class="tfp-tip">勾选多个标签 = 筛选「同时拥有」这些标签的词语</div>
            <ArticleTagPicker v-model="selectedFilterTags" :multiple="true" />
          </div>
        </div>

        <div v-for="currentLetter in lettersToLoop" :key="currentLetter" class="letter-group">
          <!-- 该字母下的单词列表 -->
          <div class="letter-words">
            <!-- 字母标签 -->
            <div class="letter-tag" :id="`letter-${currentLetter}`">
              {{ currentLetter.toUpperCase() }}
            </div>
            <!-- 列表模式：根据书签展示单词或短语 -->
            <van-swipe-cell
              v-if="resourceType === 'word' && currentDisplayMode === 'word'"
              v-for="word in (displayWordsByLetter[currentLetter] || [])"
              :key="word.id"
              :ref="el => registerSwipeRef(word.id, el)"
              class="swipe-cell"
              :disabled="selectMode"
              @open="onSwipeOpen(word.id)"
              @close="onSwipeClose(word.id)"
            >
              <div class="swipe-cell-body">
                <van-checkbox
                  v-if="selectMode"
                  class="row-checkbox"
                  :model-value="selectedIds.has(word.id)"
                  @click.stop="toggleItemSelect(word.id)"
                />
                <van-cell
                  :title="word.word"
                  :is-link="!selectMode"
                  @click="onRowClick(word)"
                  class="word-item"
                />
              </div>
              <template #right>
                <div class="row-actions">
                  <button type="button" class="ra-btn ra-status" @click="onActionStatus(word)">状态</button>
                  <button type="button" class="ra-btn ra-tag" @click="onActionTag(word)">标签</button>
                  <button type="button" class="ra-btn ra-delete" @click="onActionDelete(word)">删除</button>
                </div>
              </template>
            </van-swipe-cell>
            <van-swipe-cell
              v-else-if="resourceType === 'phrase' && currentDisplayMode === 'word'"
              v-for="item in (displayPhrasesByLetter[currentLetter] || [])"
              :key="item.id"
              :ref="el => registerSwipeRef(item.id, el)"
              class="swipe-cell"
              :disabled="selectMode"
              @open="onSwipeOpen(item.id)"
              @close="onSwipeClose(item.id)"
            >
              <div class="swipe-cell-body">
                <van-checkbox
                  v-if="selectMode"
                  class="row-checkbox"
                  :model-value="selectedIds.has(item.id)"
                  @click.stop="toggleItemSelect(item.id)"
                />
                <van-cell
                  :title="item.word"
                  :is-link="!selectMode"
                  @click="onRowClick(item)"
                  class="word-item phrase-mode"
                >
                  <template #label>
                    <div class="phrase-subtitle">
                    </div>
                  </template>
                </van-cell>
              </div>
              <template #right>
                <div class="row-actions">
                  <button type="button" class="ra-btn ra-status" @click="onActionStatus(item)">状态</button>
                  <button type="button" class="ra-btn ra-tag" @click="onActionTag(item)">标签</button>
                  <button type="button" class="ra-btn ra-delete" @click="onActionDelete(item)">删除</button>
                </div>
              </template>
            </van-swipe-cell>

            <!-- 状态模式：单词 -->
            <van-swipe-cell
              v-if="currentDisplayMode === 'status' && resourceType === 'word'"
              v-for="word in getFilteredWordsForStatus(currentLetter)"
              :key="word.id"
              :ref="el => registerSwipeRef(word.id, el)"
              class="swipe-cell"
              :disabled="selectMode"
              @open="onSwipeOpen(word.id)"
              @close="onSwipeClose(word.id)"
            >
              <div class="swipe-cell-body">
                <van-checkbox
                  v-if="selectMode"
                  class="row-checkbox"
                  :model-value="selectedIds.has(word.id)"
                  @click.stop="toggleItemSelect(word.id)"
                />
                <van-cell
                  :title="word.word"
                  :is-link="!selectMode"
                  @click="onRowClick(word)"
                  class="word-item status-mode"
                >
                  <template #value>
                    <div class="status-indicator" :class="getStatusClass(word.status)" v-if="word.status > 0">
                      <span class="status-dot"></span>
                      <span class="status-text">{{ getStatusText(word.status) }}</span>
                    </div>
                  </template>
                </van-cell>
              </div>
              <template #right>
                <div class="row-actions">
                  <button type="button" class="ra-btn ra-status" @click="onActionStatus(word)">状态</button>
                  <button type="button" class="ra-btn ra-tag" @click="onActionTag(word)">标签</button>
                  <button type="button" class="ra-btn ra-delete" @click="onActionDelete(word)">删除</button>
                </div>
              </template>
            </van-swipe-cell>

            <!-- 状态模式：短语 -->
            <van-swipe-cell
              v-else-if="currentDisplayMode === 'status' && resourceType === 'phrase'"
              v-for="item in getFilteredPhrasesForStatus(currentLetter)"
              :key="item.id"
              :ref="el => registerSwipeRef(item.id, el)"
              class="swipe-cell"
              :disabled="selectMode"
              @open="onSwipeOpen(item.id)"
              @close="onSwipeClose(item.id)"
            >
              <div class="swipe-cell-body">
                <van-checkbox
                  v-if="selectMode"
                  class="row-checkbox"
                  :model-value="selectedIds.has(item.id)"
                  @click.stop="toggleItemSelect(item.id)"
                />
                <van-cell
                  :title="item.word"
                  :is-link="!selectMode"
                  @click="onRowClick(item)"
                  class="word-item status-mode phrase-mode"
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
              </div>
              <template #right>
                <div class="row-actions">
                  <button type="button" class="ra-btn ra-status" @click="onActionStatus(item)">状态</button>
                  <button type="button" class="ra-btn ra-tag" @click="onActionTag(item)">标签</button>
                  <button type="button" class="ra-btn ra-delete" @click="onActionDelete(item)">删除</button>
                </div>
              </template>
            </van-swipe-cell>

            <!-- 标签模式：单词. 直接遍历 wordsByLetter (associate 已把 tags 挂到每条 word 上) -->
            <van-swipe-cell
              v-else-if="currentDisplayMode === 'tag' && resourceType === 'word'"
              v-for="word in (displayWordsByLetter[currentLetter] || [])"
              :key="word.id"
              :ref="el => registerSwipeRef(word.id, el)"
              class="swipe-cell"
              :disabled="selectMode"
              @open="onSwipeOpen(word.id)"
              @close="onSwipeClose(word.id)"
            >
              <div class="swipe-cell-body">
                <van-checkbox
                  v-if="selectMode"
                  class="row-checkbox"
                  :model-value="selectedIds.has(word.id)"
                  @click.stop="toggleItemSelect(word.id)"
                />
                <van-cell
                  :title="word.word"
                  :is-link="!selectMode"
                  @click="onRowClick(word)"
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
              </div>
              <template #right>
                <div class="row-actions">
                  <button type="button" class="ra-btn ra-status" @click="onActionStatus(word)">状态</button>
                  <button type="button" class="ra-btn ra-tag" @click="onActionTag(word)">标签</button>
                  <button type="button" class="ra-btn ra-delete" @click="onActionDelete(word)">删除</button>
                </div>
              </template>
            </van-swipe-cell>

            <!-- 标签模式：短语 -->
            <van-swipe-cell
              v-else-if="currentDisplayMode === 'tag' && resourceType === 'phrase'"
              v-for="item in (displayPhrasesByLetter[currentLetter] || [])"
              :key="item.id"
              :ref="el => registerSwipeRef(item.id, el)"
              class="swipe-cell"
              :disabled="selectMode"
              @open="onSwipeOpen(item.id)"
              @close="onSwipeClose(item.id)"
            >
              <div class="swipe-cell-body">
                <van-checkbox
                  v-if="selectMode"
                  class="row-checkbox"
                  :model-value="selectedIds.has(item.id)"
                  @click.stop="toggleItemSelect(item.id)"
                />
                <van-cell
                  :title="item.word"
                  :is-link="!selectMode"
                  @click="onRowClick(item)"
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
              <template #right>
                <div class="row-actions">
                  <button type="button" class="ra-btn ra-status" @click="onActionStatus(item)">状态</button>
                  <button type="button" class="ra-btn ra-tag" @click="onActionTag(item)">标签</button>
                  <button type="button" class="ra-btn ra-delete" @click="onActionDelete(item)">删除</button>
                </div>
              </template>
            </van-swipe-cell>

          </div>
        </div>

        <!-- 标签筛选加载中 -->
        <div v-if="currentDisplayMode === 'tag' && filterLoading" class="global-loading">
          <van-loading size="20px" vertical>筛选中...</van-loading>
        </div>

        <!-- 标签筛选无结果 -->
        <van-empty
          v-if="currentDisplayMode === 'tag' && selectedFilterTags.length > 0 && !filterLoading && filteredCount === 0"
          description="没有同时拥有这些标签的词语"
        />

        <!-- 搜索中 / 搜索无结果 -->
        <div v-if="hasKeyword && searchLoading" class="global-loading">
          <van-loading size="20px" vertical>搜索中...</van-loading>
        </div>
        <van-empty
          v-else-if="hasKeyword && !searchLoading && lettersToLoop.length === 0"
          :description="resourceType === 'phrase' ? '没有匹配的短语' : '没有匹配的单词'"
        />

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

          <!-- 已加载完毕提示 (搜索态下隐藏, 结果集已是完整匹配) -->
          <div v-if="!hasKeyword && !hasMoreWords && allWords.length > 0 && currentDisplayMode === 'word'" class="load-complete">
            <van-divider>已加载全部单词</van-divider>
          </div>
          <div v-if="!hasKeyword && !hasMorePhrases && phraseList.length > 0 && currentDisplayMode === 'phrase'" class="load-complete">
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
          @delete="confirmDeleteWord"
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

    <!-- A-Z 首字母快速跳转条 (列表视图显示, 点击跳到对应字母) -->
    <div
      v-if="!selectedWord && !selectedPhrase && lettersToLoop.length > 0"
      class="az-index-bar"
    >
      <span
        v-for="letter in lettersToLoop"
        :key="letter"
        class="az-index-item"
        :class="{ active: currentActiveLetter === letter }"
        @click="scrollToLetter(letter)"
      >{{ letter === '#' ? '#' : letter.toUpperCase() }}</span>
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

    <!-- 多选模式底部操作条 (浮在 tabbar 之上) -->
    <transition name="select-bar-slide">
      <div v-if="selectMode" class="select-action-bar">
        <div class="sab-left" @click="toggleSelectAll">
          <van-checkbox :model-value="allVisibleSelected" />
          <span class="sab-all-text">{{ allVisibleSelected ? '取消全选' : '全选' }}</span>
        </div>
        <div class="sab-count">已选 {{ selectedCount }}</div>
        <div
          class="sab-delete"
          :class="{ disabled: selectedCount === 0 || batchDeleting }"
          @click="confirmBatchDelete"
        >{{ batchDeleting ? '删除中...' : '删除' }}</div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getWordList, getWordDetail, generateWordPicture, updateWordPicture, addWord, deleteWord, batchDeleteWord, getWordStatusList, updateWordStatus, getWordTagList, updateWordTag, getWordPhraseList, getWordPhraseDetail, addWordPhrase, updateWordPhrase, deleteWordPhrase, batchDeleteWordPhrase, generatePhrasePicture, updatePhrasePicture, importWord, listWordsByTags } from '@/api/dictionary'
import { getTagList } from '@/api/tag'
import { uploadFile, selectFiles } from '@/api/file'
import { getUserInfo, getUserId, getToken } from '@/utils/auth'
import { getResourceUrl } from '@/utils/request'
import { showToast, closeToast, showConfirmDialog } from 'vant'

// Sub-components
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
import ArticleTagPicker from '@/components/article/ArticleTagPicker.vue'

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
const currentActiveLetter = ref('')

// 显示模式切换相关
const resourceType = ref(props.defaultType || 'word')
const currentDisplayMode = ref('word')
const displayModes = computed(() => ([
  // value:'word' 是"按字母列表"视图; 标签固定叫"列表", 避免与搜索栏的 词/短语 切换重名
  { label: '列表', value: 'word' },
  { label: '状态', value: 'status' },
  { label: '标签', value: 'tag' }
]))

// ========== 就地搜索 (搜索栏前缀筛列表) ==========
// keyword 非空时, 按前缀就地筛当前列表, 复用现有"按字母分组渲染"。
// 单词列表已全量在内存(loadWords 拉 limit 100000), 直接前端前缀过滤即可、且完整;
// 短语列表是分页加载的, 仅前几页在内存, 故走后端 phrase_prefix 拉全部匹配, 保证不漏。
const keyword = ref('')
// 已防抖确认、用于实际过滤的关键词(input 即时绑 keyword, 防抖后再写入 activeKeyword 触发筛选)
const activeKeyword = ref('')
const searchPhraseResults = ref([])  // 短语前缀结果 (后端 phrase_prefix 拉取)
const searchLoading = ref(false)
let keywordDebounceTimer = null
let phraseSearchSeq = 0              // 短语异步搜索竞态序号, 仅采用最后一次

const hasKeyword = computed(() => activeKeyword.value.trim().length > 0)

// 单词列表全量在内存, 直接前缀过滤即可; 用 computed 保证 allWords 关联状态/标签后结果同步更新
const searchWordResults = computed(() => {
  const kw = activeKeyword.value.trim().toLowerCase()
  if (!kw) return []
  return allWords.value.filter(w => (w.word || '').toLowerCase().startsWith(kw))
})

const runPhraseSearch = async (kw) => {
  if (!kw) { searchPhraseResults.value = []; return }
  const seq = ++phraseSearchSeq
  try {
    searchLoading.value = true
    const resp = await getWordPhraseList({ phrase_prefix: kw, limit: 100000 })
    if (seq !== phraseSearchSeq) return // 已有更新的搜索, 丢弃旧结果
    searchPhraseResults.value = (resp && resp.code === 0) ? (resp.data || []) : []
  } catch (e) {
    if (seq === phraseSearchSeq) searchPhraseResults.value = []
  } finally {
    if (seq === phraseSearchSeq) searchLoading.value = false
  }
}

// 防抖后真正执行: 写入 activeKeyword(驱动单词 computed 过滤), 并按需拉短语前缀结果
const runSearch = () => {
  const kw = keyword.value.trim()
  activeKeyword.value = kw
  if (resourceType.value === 'phrase') runPhraseSearch(kw)
}

const onKeywordInput = () => {
  if (keywordDebounceTimer) clearTimeout(keywordDebounceTimer)
  // 多选/已展开左滑行与搜索互斥: 输入即收起
  if (selectMode.value) clearSelection()
  closeAllRows()
  keywordDebounceTimer = setTimeout(runSearch, 300)
}

const clearKeyword = () => {
  if (keywordDebounceTimer) { clearTimeout(keywordDebounceTimer); keywordDebounceTimer = null }
  keyword.value = ''
  activeKeyword.value = ''
  searchPhraseResults.value = []
  searchLoading.value = false
}

// ========== 多选批量删除 ==========
// selectMode 下: 禁用页面横滑切视图 / 行长按左滑 / 点击进详情; 改为点行勾选, 底部操作条统一删除。
const selectMode = ref(false)
// 当前 resourceType 下被勾选的 id 集合。切 resourceType/displayMode/搜索/筛选时必须清空(尤其切 resourceType, 防单词/短语 id 串)。
const selectedIds = ref(new Set())
const selectedCount = computed(() => selectedIds.value.size)
const batchDeleting = ref(false)

// 当前视图(列表/状态/标签 × 单词/短语)实际渲染出来的全部条目, 供"全选"用。
const visibleItems = computed(() => {
  const out = []
  for (const letter of lettersToLoop.value) {
    let rows = []
    if (currentDisplayMode.value === 'tag') {
      rows = resourceType.value === 'word'
        ? (displayWordsByLetter.value[letter] || [])
        : (displayPhrasesByLetter.value[letter] || [])
    } else if (currentDisplayMode.value === 'status') {
      rows = resourceType.value === 'word'
        ? getFilteredWordsForStatus(letter)
        : getFilteredPhrasesForStatus(letter)
    } else {
      rows = resourceType.value === 'word'
        ? (displayWordsByLetter.value[letter] || [])
        : (displayPhrasesByLetter.value[letter] || [])
    }
    for (const r of rows) out.push(r)
  }
  return out
})
const allVisibleSelected = computed(() =>
  visibleItems.value.length > 0 && visibleItems.value.every(it => selectedIds.value.has(it.id))
)

const clearSelection = () => {
  selectedIds.value = new Set()
}
const exitSelectMode = () => {
  selectMode.value = false
  clearSelection()
}
const enterSelectMode = () => {
  // 进入多选前先收掉任何已展开的左滑行, 两套交互互斥
  closeAllRows()
  clearSelection()
  selectMode.value = true
}
const toggleSelectMode = () => {
  if (selectMode.value) exitSelectMode()
  else enterSelectMode()
}
const toggleItemSelect = (id) => {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}
const toggleSelectAll = () => {
  if (allVisibleSelected.value) {
    clearSelection()
  } else {
    selectedIds.value = new Set(visibleItems.value.map(it => it.id))
  }
}

// ========== 行左滑 (van-swipe-cell): 一次只展开一行 ==========
// 每行的 van-swipe-cell 实例按 id 注册到此 Map, 打开一行时关闭其它行(Vant 默认不互斥)。
const swipeRefs = new Map()       // { [id]: SwipeCell 组件实例 }
const openedRowId = ref(null)     // 当前展开露出按钮的行 id(同时只允许一行); 点该行 cell 时先收起不进详情

// :ref 回调: el 为组件实例(挂载)或 null(卸载)。卸载时清理, 避免 Map 残留已删行。
const registerSwipeRef = (id, el) => {
  if (el) swipeRefs.set(id, el)
  else swipeRefs.delete(id)
}

// 关闭所有已展开的行(切 Tab / 进多选 / 搜索输入 / 点按钮 时调用, 收起任何露出的按钮)。
const closeAllRows = () => {
  swipeRefs.forEach(cell => {
    if (cell && typeof cell.close === 'function') cell.close()
  })
  openedRowId.value = null
}

// 某行被打开时, 关闭其它所有行, 保证一次只展开一行。
const onSwipeOpen = (openedId) => {
  swipeRefs.forEach((cell, id) => {
    if (id !== openedId && cell && typeof cell.close === 'function') cell.close()
  })
  openedRowId.value = openedId
}

// 行收起(滑回 / 点别处)时清掉记录, 让该行 cell 点击恢复"进详情"。
const onSwipeClose = (closedId) => {
  if (openedRowId.value === closedId) openedRowId.value = null
}

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

// 标签模式下的多标签筛选(AND 语义: 只显示同时拥有全部所选标签的词语)
const selectedFilterTags = ref([])
const showTagFilter = ref(false)

// 短语数据
const phraseList = ref([])
const phrasesByLetter = ref({})
const loadingPhraseData = ref(false)
const hasMorePhrases = ref(true)
const phraseOffset = ref(0)
const loadingMorePhrases = ref(false)

// 标签筛选(AND): 服务端实时查询"同时拥有全部所选标签"的词语, 避免前端快照过期/关联错乱
const filterResults = ref([]) // 后端返回的匹配词条 [{id, word, tags}]
const filterLoading = ref(false)
const tagFilterActive = computed(
  () => currentDisplayMode.value === 'tag' && selectedFilterTags.value.length > 0
)

const fetchTagFilter = async () => {
  if (!tagFilterActive.value) {
    filterResults.value = []
    return
  }
  filterLoading.value = true
  try {
    const resp = await listWordsByTags({
      tag_ids: selectedFilterTags.value,
      word_type: resourceType.value === 'phrase' ? 2 : 1
    })
    filterResults.value = (resp && resp.data) || []
  } catch (e) {
    filterResults.value = []
  } finally {
    filterLoading.value = false
  }
}
watch([selectedFilterTags, resourceType, currentDisplayMode], fetchTagFilter, { deep: true })

// 切 resourceType/displayMode/标签筛选 时退出多选并清空选择(切 resourceType 必须清, 防 word/phrase id 串)，
// 同时收掉任何已展开的左滑行。selectedIds 存的是当前 resourceType 下的 id, 一旦上下文变化即作废。
watch([resourceType, currentDisplayMode], () => {
  if (selectMode.value) exitSelectMode()
  closeAllRows()
})
watch(selectedFilterTags, () => {
  if (selectMode.value) clearSelection()
  closeAllRows()
}, { deep: true })

// 短语搜索结果来自后端(只有 id/phrase), 这里用内存里已加载的状态/标签快照补齐,
// 让搜索后的状态/标签视图仍能正确显示 (没快照的就当未设置, 与正常列表一致)。
const enrichPhrasesWithStatusTags = (phrases) => {
  const statusMap = {}
  statusPhrases.value.forEach(item => {
    const pid = item.word_id ?? item.wordId
    if (pid != null) statusMap[pid] = Number(item.status ?? item.state ?? 0)
  })
  const tagMap = {}
  tagPhrases.value.forEach(item => {
    const pid = item.word_id ?? item.wordId
    if (pid != null) tagMap[pid] = item.tags || []
  })
  return phrases.map(p => ({
    id: p.id,
    word: p.phrase ?? p.word ?? '',
    status: statusMap[p.id] !== undefined ? statusMap[p.id] : 0,
    tags: tagMap[p.id] || []
  }))
}

// 词条渲染的唯一数据源(按字母分组)。优先级: 搜索(就地前缀筛) > 标签AND筛选 > 全量列表。
const displayWordsByLetter = computed(() => {
  if (hasKeyword.value) return categorizeWordsByLetter(searchWordResults.value)
  if (tagFilterActive.value && resourceType.value === 'word') return categorizeWordsByLetter(filterResults.value)
  return wordsByLetter.value
})
const displayPhrasesByLetter = computed(() => {
  if (hasKeyword.value) return categorizePhrasesByLetter(enrichPhrasesWithStatusTags(searchPhraseResults.value))
  if (tagFilterActive.value && resourceType.value === 'phrase') return categorizePhrasesByLetter(filterResults.value)
  return phrasesByLetter.value
})
const filteredCount = computed(() => (tagFilterActive.value ? filterResults.value.length : 0))

// 按模式选择字母循环 (标签筛选生效时基于过滤后的分组, 空字母自动隐藏)
const lettersToLoop = computed(() => {
  const map = resourceType.value === 'phrase' ? displayPhrasesByLetter.value : displayWordsByLetter.value
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

// 把 getWordTagList 返回的扁平 word_tag 行 ({word_id, tag_id, name, style, ...})
// 按 word_id 聚合成 [{word_id, tags: [{id, name, style}]}] 形态, 给 associate* 用.
// 后端的多标签场景下, 同一 word_id 会有多行返回, 聚合后才能正确显示.
const groupTagsByWordId = (rows) => {
  const map = new Map()
  for (const r of rows || []) {
    const wid = r.word_id ?? r.wordId
    if (wid == null) continue
    let item = map.get(wid)
    if (!item) {
      item = { word_id: wid, tags: [] }
      map.set(wid, item)
    }
    item.tags.push({
      id: r.tag_id ?? r.tagId,
      name: r.name,
      style: r.style,
    })
  }
  return Array.from(map.values())
}

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

// 从 display 映射取数(搜索生效时即为前缀筛后的结果), 有状态的排前面
const getFilteredWordsForStatus = (letter) => {
  const wordsForLetter = displayWordsByLetter.value[letter] || []
  const withStatus = []
  const withoutStatus = []
  for (const w of wordsForLetter) {
    if (Number(w.status) > 0) withStatus.push(w)
    else withoutStatus.push(w)
  }
  return [...withStatus, ...withoutStatus]
}

const getFilteredPhrasesForStatus = (letter) => {
  const items = displayPhrasesByLetter.value[letter] || []
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
  if (loadingMore.value) return
  try {
    loadingMore.value = true
    // 单词列表只含 id+word, 数据量极小(几百词约 20KB), 一次性全量加载。
    // 这样所有首字母分组都在内存里, 右侧字母条才能跳到任意字母(含尚未滚动到的)。
    const params = { offset: 0, limit: 100000, orderby: 'word' }
    const response = await getWordList(params)
    const data = response.data || []
    allWords.value = data
    currentOffset.value = data.length
    wordsByLetter.value = categorizeWordsByLetter(allWords.value)
    hasMoreWords.value = false
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
      // 全量单词已加载, 这里按 word_type 一次性取该用户全部状态, 避免把几百个 word_id 拼进 URL(过长会被网关 414)
      const response = await getWordStatusList(undefined, 1)
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
      // 同上: 一次性取该用户全部单词标签, 不按 id 拼 URL
      const [wordTagResponse, tagListResponse] = await Promise.all([
        getWordTagList(undefined, 1),
        getTagList()
      ])
      if (wordTagResponse.code === 0) {
        tagWords.value = groupTagsByWordId(wordTagResponse.data)
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
      if (wordTagResponse.code === 0) tagWords.value = groupTagsByWordId(wordTagResponse.data)
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
        tagPhrases.value = groupTagsByWordId(resp.data)
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
      const grouped = groupTagsByWordId(tagResponse.data)
      if (append) tagWords.value = [...tagWords.value, ...grouped]
      else tagWords.value = grouped
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
  // 切 资源类型(词↔短语) 时清空搜索: 两者前缀语义/数据源不同, 清空最稳妥
  clearKeyword()
  resourceType.value = type
  selectedWord.value = null
  selectedPhrase.value = null
  transitionName.value = 'list-slide'
  if (type === 'word') router.push('/dictionary/words')
  else router.push('/dictionary/phrases')
}

// 搜索栏左侧 词/短语 切换: 在 word↔phrase 间 toggle
const toggleResourceType = () => {
  switchResourceType(resourceType.value === 'word' ? 'phrase' : 'word')
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

const updateActiveLetter = () => {
  const container = scrollContainer.value
  if (!container) return
  const scrollTop = container.scrollTop
  const letters = lettersToLoop.value
  let active = letters[0] || ''
  for (const letter of letters) {
    const el = document.getElementById(`letter-${letter}`)
    if (!el) continue
    const group = el.closest('.letter-group') || el
    if (group.offsetTop <= scrollTop + 60) {
      active = letter
    } else {
      break
    }
  }
  currentActiveLetter.value = active
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
    // 搜索态下结果集已完整(单词全量过滤 / 短语后端拉全), 不再触发分页加载更多
    if (scrollProgress > 0.8 && !hasKeyword.value) {
      if (currentDisplayMode.value === 'word' && resourceType.value === 'word' && hasMoreWords.value && !loadingMore.value) {
        loadMoreWords()
      } else if (currentDisplayMode.value === 'word' && resourceType.value === 'phrase' && hasMorePhrases.value && !loadingMorePhrases.value) {
        loadMorePhrases()
      }
    }
    updateActiveLetter()
  }
  _scrollHandler = handleScroll
  _scrollHandlerNode = scrollContainer.value
  scrollContainer.value.addEventListener('scroll', handleScroll)
  updateActiveLetter()
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
    } else {
      showToast(resp.message || '获取短语详情失败')
    }
  } catch (err) {
    console.error('获取短语详情失败:', err)
    showToast('网络错误，请稍后重试')
  }
}

// 点击左侧字母条, 平滑滚动到对应首字母分组的第一个词条
const scrollToLetter = (letter) => {
  const container = scrollContainer.value
  if (!container) return
  // 用 getElementById 兼容 '#' 这种非法 CSS 选择器字符
  const anchor = document.getElementById(`letter-${letter}`)
  if (!anchor) return
  const group = anchor.closest('.letter-group') || anchor
  container.scrollTo({ top: group.offsetTop, behavior: 'smooth' })
}

const goBack = () => {
  selectedWord.value = null
  selectedPhrase.value = null
  nextTick(() => {
    if (scrollContainer.value) scrollContainer.value.scrollTop = lastScrollTop.value || 0
  })
}

// ========== 过渡钩子 ==========

const handleAfterEnter = (el) => {
  if (!el) return
  if (el.classList && el.classList.contains('alphabetical-word-list')) {
    scrollContainer.value = el
    el.scrollTop = lastScrollTop.value || 0
  }
}

// ========== 滑动手势 (仅保留: 详情页右滑返回列表) ==========
// 视图切换改为只点 Tab(switchDisplayMode); 行左滑由 van-swipe-cell 自管, 不再有页面级横滑切视图。

let touchStartX = 0
let touchStartY = 0

const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

const handleTouchEnd = (e) => {
  // 仅在单词/短语详情页生效: 整页右滑 → 返回列表
  if (!selectedWord.value && !selectedPhrase.value) return
  const deltaX = e.changedTouches[0].clientX - touchStartX
  const deltaY = e.changedTouches[0].clientY - touchStartY
  const minSwipeDistance = 50
  if (deltaX > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
    transitionName.value = 'page-slide-right'
    goBack()
    nextTick(() => {
      if (scrollContainer.value) scrollContainer.value.scrollTop = lastScrollTop.value || 0
    })
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

// 单词删除: 通过 WordDetailView 顶部的删除按钮触发, 弹确认对话框防误触
const confirmDeleteWord = async () => {
  if (!selectedWord.value || !selectedWord.value.id) return
  try {
    await showConfirmDialog({
      title: '删除单词',
      message: `确定删除 "${selectedWord.value.word}" 吗? 已积累的学习/复习状态和标签关联会一并清除, 不可恢复.`,
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonColor: '#ee0a24',
    })
  } catch {
    return // 用户点了取消
  }
  try {
    const wordId = selectedWord.value.id
    const wordText = selectedWord.value.word
    const resp = await deleteWord(wordId)
    if (resp.code === 0) {
      // 从内存列表里同步移除(含状态/标签快照), 三视图都不再显示, 不必重拉
      removeWordsFromMemory([wordId])
      showToast(`已删除 "${wordText}"`)
      goBack()
    } else {
      showToast(resp.message || '删除失败, 请重试')
    }
  } catch (err) {
    console.error('删除单词失败:', err)
    showToast('网络错误, 请稍后重试')
  }
}

const deletePhrase = async () => {
  if (!editingPhrase.value || !phraseForm.id) return
  try {
    const resp = await deleteWordPhrase({ id: phraseForm.id })
    if (resp.code === 0) {
      removePhrasesFromMemory([phraseForm.id])
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

// ========== 删除后内存同步 ==========
// 按 id 集合从内存数据移除并重算分组, 保证三视图(列表/状态/标签)都不再显示已删项。
// 单词/短语各自的关联数据(status/tag 快照)也一并清理, 避免计数/筛选残留。
const removeWordsFromMemory = (ids) => {
  const idSet = ids instanceof Set ? ids : new Set(ids)
  allWords.value = allWords.value.filter(w => !idSet.has(w.id))
  statusWords.value = statusWords.value.filter(w => !idSet.has(w.word_id ?? w.wordId))
  tagWords.value = tagWords.value.filter(w => !idSet.has(w.word_id ?? w.wordId ?? w.id))
  filterResults.value = filterResults.value.filter(w => !idSet.has(w.id))
  wordsByLetter.value = categorizeWordsByLetter(allWords.value)
}

const removePhrasesFromMemory = (ids) => {
  const idSet = ids instanceof Set ? ids : new Set(ids)
  phraseList.value = phraseList.value.filter(p => !idSet.has(p.id))
  statusPhrases.value = statusPhrases.value.filter(p => !idSet.has(p.word_id ?? p.wordId))
  tagPhrases.value = tagPhrases.value.filter(p => !idSet.has(p.word_id ?? p.wordId ?? p.id))
  filterResults.value = filterResults.value.filter(p => !idSet.has(p.id))
  phrasesByLetter.value = categorizePhrasesByLetter(phraseList.value)
}

// 单行左滑 → 删除按钮: 弹确认后按 resourceType 调单删, 成功后内存同步移除该行。
const deleteSingleItem = async (item) => {
  if (!item || item.id == null) return
  const id = item.id
  const label = item.word || item.phrase || ''
  try {
    await showConfirmDialog({
      title: resourceType.value === 'phrase' ? '删除短语' : '删除单词',
      message: `确定删除 "${label}" 吗? 已积累的学习/复习状态和标签关联会一并清除, 不可恢复.`,
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonColor: '#ee0a24',
    })
  } catch {
    return // 用户取消, 保持打开态由用户自行收起
  }
  try {
    const resp = resourceType.value === 'phrase'
      ? await deleteWordPhrase({ id })
      : await deleteWord(id)
    if (resp.code === 0) {
      if (resourceType.value === 'phrase') removePhrasesFromMemory([id])
      else removeWordsFromMemory([id])
      swipeRefs.delete(id)
      showToast(`已删除 "${label}"`)
    } else {
      showToast(resp.message || '删除失败, 请重试')
    }
  } catch (err) {
    console.error('删除失败:', err)
    showToast('网络错误, 请稍后重试')
  }
}

// 多选批量删除: 确认后按 resourceType 调批删, 成功后内存同步移除并退出多选。
const confirmBatchDelete = async () => {
  if (batchDeleting.value || selectedIds.value.size === 0) return
  const ids = [...selectedIds.value]
  const isPhrase = resourceType.value === 'phrase'
  try {
    await showConfirmDialog({
      title: isPhrase ? '批量删除短语' : '批量删除单词',
      message: `确定删除选中的 ${ids.length} 项吗? 已积累的学习/复习状态和标签关联会一并清除, 不可恢复.`,
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonColor: '#ee0a24',
    })
  } catch {
    return // 用户取消
  }
  try {
    batchDeleting.value = true
    const resp = isPhrase ? await batchDeleteWordPhrase(ids) : await batchDeleteWord(ids)
    if (resp.code === 0) {
      if (isPhrase) removePhrasesFromMemory(ids)
      else removeWordsFromMemory(ids)
      const n = resp?.deleted ?? ids.length
      exitSelectMode()
      showToast(`已删除 ${n} 项`)
    } else {
      showToast(resp.message || '删除失败, 请重试')
    }
  } catch (err) {
    console.error('批量删除失败:', err)
    showToast('网络错误, 请稍后重试')
  } finally {
    batchDeleting.value = false
  }
}

// ========== 行点击 / 左滑三按钮 ==========
// 行 van-cell 点击: 多选下勾选; 否则统一进单词/短语详情(三视图一致)。
// 若该行正展开着左滑按钮, 点一下先收起、不进详情。
const onRowClick = (item) => {
  if (selectMode.value) {
    toggleItemSelect(item.id)
    return
  }
  if (openedRowId.value === item.id) {
    closeAllRows()
    return
  }
  if (resourceType.value === 'phrase') selectPhrase(item.id)
  else selectWord(item.id)
}

// 左滑三按钮: 点击后先收起该行, 再复用现有业务弹窗/删除逻辑。
const onActionStatus = (item) => {
  closeAllRows()
  openStatusModal(item)
}
const onActionTag = (item) => {
  closeAllRows()
  openTagModal(item)
}
const onActionDelete = (item) => {
  closeAllRows()
  deleteSingleItem(item)
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
/* ============================================================
   EDITORIAL — 词典 main surface. Cool-blue brand, hairline rows,
   soft white cards, oversized title, pill chips. Mirrors login.
   ============================================================ */
.dictionary-page {
  min-height: 100vh;
  /* transparent — let the global cool wash (#app) show through */
  background: transparent;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
               'Hiragino Sans GB', 'Microsoft YaHei', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ---- brand header — compressed to a slim title strip ---- */
.dictionary-header {
  background: linear-gradient(118deg, var(--es-grad-a) 0%, var(--es-primary) 56%, var(--es-teal) 130%);
  padding: 14px 20px 13px;
  color: #fff;
  position: relative;
  overflow: hidden;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  box-shadow: 0 10px 26px -18px rgba(25, 137, 250, .55);

  /* one soft drifting glow — the single restrained accent gesture */
  .header-glow {
    position: absolute;
    width: 200px; height: 200px;
    top: -120px; right: -60px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, .30), rgba(255, 255, 255, 0) 66%);
    pointer-events: none;
    animation: dictGlow 17s var(--es-ease) infinite alternate;
  }

  /* slim one-line lockup: eyebrow · title */
  .header-bar {
    display: flex; align-items: baseline; gap: 10px;
    position: relative; z-index: 1;
  }

  .page-eyebrow {
    font-size: 10px;
    letter-spacing: .2em;
    text-transform: uppercase;
    font-weight: 600;
    color: rgba(255, 255, 255, .78);
  }

  .page-title {
    font-size: 20px; font-weight: 800;
    letter-spacing: -.01em; line-height: 1.1;

    .accent {
      color: #fff;
      position: relative;
      &::after {
        content: '';
        position: absolute;
        left: 0; right: 0; bottom: 1px;
        height: 6px; border-radius: 3px;
        background: rgba(255, 255, 255, .26);
        z-index: -1;
      }
    }
  }
}
@keyframes dictGlow {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-22px, 26px) scale(1.12); }
}

/* ---- 工具栏: 常显搜索栏 + 视图下划线 Tab ---- */
.dictionary-toolbar {
  max-width: 800px;
  margin: 0 auto;
  padding: 12px 14px 0;
  position: relative;
  z-index: 2;
}

/* 搜索栏: 左侧 词/短语 切换 + 右侧前缀搜索框 */
.search-bar {
  display: flex;
  align-items: stretch;
  gap: 8px;
  height: 40px;
}

.resource-toggle {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 12px;
  border-radius: 12px;
  background: linear-gradient(118deg, var(--es-grad-a) 0%, var(--es-primary) 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  box-shadow: 0 6px 14px -8px rgba(25, 137, 250, .7);
  transition: transform 0.15s var(--es-ease), box-shadow 0.2s var(--es-ease);

  .rt-label { letter-spacing: .04em; }
  .rt-caret { font-size: 13px; opacity: .85; }
  &:active { transform: scale(0.96); }
}

.search-field {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  border-radius: 12px;
  background: var(--es-surface);
  border: 1px solid var(--es-hair);
  box-shadow: var(--es-shadow-soft);

  .sf-icon { color: var(--es-ink-3); font-size: 16px; flex: 0 0 auto; }
  .sf-clear { color: var(--es-ink-3); font-size: 16px; flex: 0 0 auto; cursor: pointer; }

  .sf-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    outline: none;
    background: transparent;
    font-size: 15px;
    color: var(--es-ink);
    /* 去掉移动端 search 类型自带的清除/装饰按钮, 用自定义 clear 图标 */
    -webkit-appearance: none;
    appearance: none;

    &::placeholder { color: var(--es-ink-3); }
    &::-webkit-search-cancel-button,
    &::-webkit-search-decoration { -webkit-appearance: none; appearance: none; }
  }
}

/* 视图下划线 Tab + 多选入口 */
.view-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  border-bottom: 1px solid var(--es-hair);
}
.view-tabs-track {
  display: flex;
  align-items: flex-end;
  gap: 22px;
}
.view-tab {
  position: relative;
  padding: 8px 2px 9px;
  cursor: pointer;
  user-select: none;

  .vt-label {
    font-size: 15px;
    font-weight: 500;
    color: var(--es-ink-2);
    transition: color 0.2s var(--es-ease), font-weight 0.2s var(--es-ease);
  }
  /* 选中项底部一条主色短下划线 */
  .vt-underline {
    position: absolute;
    left: 50%;
    bottom: -1px;
    width: 0;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: linear-gradient(90deg, var(--es-grad-a), var(--es-primary));
    transform: translateX(-50%);
    transition: width 0.22s var(--es-ease);
  }

  &.active {
    .vt-label { color: var(--es-ink); font-weight: 700; }
    .vt-underline { width: 60%; }
  }
  &:active .vt-label { color: var(--es-primary); }
}

.dictionary-content {
  padding: 12px 14px 40px;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  background: transparent;
}

.alphabetical-word-list {
  /* 视口高度 减去: 品牌条 + 工具栏(搜索栏+Tab) + 内容内边距 + 底部 tabbar */
  max-height: calc(100vh - 250px);
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

/* 左侧 A-Z 字母条是 fixed 浮层; 当内容区贴近视口左缘时(窄屏/浏览器窗口未占满),
   给词条列表让出字母条的宽度, 避免字母标签和词条左缘被遮住。
   宽屏下居中内容左侧留白已足够容纳字母条, 无需缩进。 */
@media (max-width: 880px) {
  .alphabetical-word-list { padding-left: 38px; }
}

.letter-group { margin-bottom: 22px; position: relative; }

/* 添加单词浮动按钮 */
.add-word-fab {
  position: fixed; bottom: 80px; right: 20px;
  width: 56px; height: 56px;
  background: linear-gradient(118deg, var(--es-grad-a) 0%, var(--es-primary) 56%, var(--es-teal) 130%);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12px 26px -8px rgba(25, 137, 250, .55), inset 0 1px 0 rgba(255, 255, 255, .35);
  cursor: pointer; transition: transform .25s var(--es-ease), box-shadow .25s var(--es-ease); z-index: 1000;

  &:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 16px 32px -8px rgba(25, 137, 250, .62); }
  &:active { transform: scale(0.95); }
  .van-icon { color: white; font-weight: bold; }
}

/* 字母分组标签 — editorial eyebrow */
.letter-tag {
  position: absolute; top: 14px; left: 16px;
  background: transparent;
  color: var(--es-primary);
  width: auto; height: auto; border-radius: 0;
  display: flex; align-items: center; justify-content: flex-start;
  font-size: 13px; font-weight: 800; z-index: 10;
  letter-spacing: .16em; text-transform: uppercase;
  box-shadow: none; border: 0; text-shadow: none;
  padding-left: 2px;

  &::before {
    content: '';
    width: 14px; height: 2px; border-radius: 2px; margin-right: 8px;
    background: linear-gradient(90deg, var(--es-primary), var(--es-grad-b));
  }
}

/* 字母分组卡片 — soft white surface */
.letter-words {
  background: var(--es-surface);
  border-radius: var(--es-r-card); overflow: hidden;
  box-shadow: var(--es-shadow-card);
  margin-bottom: 16px; padding-top: 42px; position: relative;
  border: 1px solid var(--es-hair-soft);
}

/* 词条行 — hairline-separated row */
.word-item {
  transition: background-color .2s var(--es-ease);
  margin-left: 0; position: relative;
  background: transparent;
}
:deep(.word-item.van-cell::after) {
  border-color: var(--es-hair);
  left: 16px; right: 16px;
}
.word-item:hover {
  background: var(--es-hair-soft);
}
.word-item:active { background: rgba(25, 137, 250, .07); }
.word-item:last-child :deep(.van-cell::after) { display: none; }

:deep(.word-item .van-cell__title) {
  font-weight: 600;
  color: var(--es-ink);
}
:deep(.word-item .van-cell__right-icon) {
  color: var(--es-ink-3);
}

.global-loading {
  text-align: center; padding: 28px;
  background: var(--es-surface);
  border-radius: var(--es-r-card);
  box-shadow: var(--es-shadow-soft);
  margin-top: 20px;
  border: 1px solid var(--es-hair-soft);
}

.load-complete :deep(.van-divider) {
  color: var(--es-ink-3);
  border-color: var(--es-hair);
  font-size: 12px;
  letter-spacing: .04em;
}

:deep(.van-loading) {
  display: flex; justify-content: center; align-items: center; flex-direction: column;
  min-height: 200px; background: var(--es-surface); border-radius: var(--es-r-card);
  box-shadow: var(--es-shadow-card); color: var(--es-ink-2);
  .van-loading__spinner { color: var(--es-primary); }
}
.global-loading :deep(.van-loading) {
  min-height: 0; background: transparent; box-shadow: none;
}

:deep(.van-empty) {
  background: var(--es-surface); border-radius: var(--es-r-card); padding: 40px 20px;
  box-shadow: var(--es-shadow-card);
  .van-empty__description { color: var(--es-ink-2); }
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

/* 状态和标签模式的单词项样式 */
.word-item {
  &.clickable {
    cursor: pointer; transition: background-color 0.2s var(--es-ease);
    &:hover { background-color: var(--es-hair-soft); }
    &:active { background-color: rgba(25, 137, 250, .07); }
  }

  :deep(.van-cell__title) {
    color: var(--es-ink); font-weight: 600; text-shadow: none;
    -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  }

  &.status-mode, &.tag-mode {
    .word-main { display: flex; justify-content: space-between; align-items: center; }
    .word-text { font-weight: 600; color: var(--es-ink); }

    /* status as tinted pill (soft bg + colored text + matching dot) */
    .status-indicator {
      display: inline-flex; align-items: center; gap: 7px;
      height: 28px; padding: 0 12px; border-radius: 999px;
      transition: all 0.25s var(--es-ease);
      white-space: nowrap; margin-right: 6px;

      .status-dot {
        width: 8px; height: 8px; border-radius: 50%;
        transition: all 0.25s var(--es-ease);
      }
      .status-text { font-size: 12px; font-weight: 700; letter-spacing: 0.2px; transition: all 0.25s var(--es-ease); }

      &.unknown {
        background: rgba(154, 163, 175, .14);
        .status-dot { background: #9AA3AF; }
        .status-text { color: #6B7280; }
      }
      &.study {
        background: rgba(61, 165, 244, .14);
        .status-dot { background: #3DA5F4; }
        .status-text { color: #1577cf; }
      }
      &.review {
        background: rgba(108, 123, 240, .14);
        .status-dot { background: #6C7BF0; }
        .status-text { color: #5563d6; }
      }
      &.strengthen {
        background: rgba(22, 192, 203, .14);
        .status-dot { background: #16C0CB; }
        .status-text { color: #0f97a0; }
      }
      &.finish {
        background: rgba(7, 193, 96, .14);
        .status-dot { background: #07c160; }
        .status-text { color: #069b4d; }
      }
      &:hover { transform: translateY(-1px); .status-dot { transform: scale(1.15); } }
    }

    /* tags as soft brand pills */
    .word-tags {
      display: flex; flex-wrap: wrap; gap: 6px; padding-top: 2px;
      .tag-item {
        display: inline-flex; align-items: center;
        padding: 3px 10px; border-radius: 999px; font-size: 12px;
        color: #fff; font-weight: 600; white-space: nowrap;
        box-shadow: 0 2px 6px -2px rgba(20, 30, 50, .25);
      }
      .no-tags { font-size: 12px; color: var(--es-ink-3); }
    }

    :deep(.van-cell__value) {
      display: flex; justify-content: flex-end; align-items: center;
      overflow: visible; padding-right: 6px;
    }
    .word-item.status-mode { overflow: visible; padding-right: 8px; }
    :deep(.van-cell) { overflow: visible; }
  }
}

/* A-Z 首字母快速跳转条 (左侧, 通讯录风格) */
.az-index-bar {
  position: fixed;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 1000;
  padding: 10px 5px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--es-hair);
  border-radius: 999px;
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 26px -14px rgba(20, 30, 50, .3);
  max-height: 86vh;
  overflow-y: auto;
  user-select: none;
}

.az-index-item {
  width: 22px;
  line-height: 1.5;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--es-ink-3);
  cursor: pointer;
  text-shadow: none;
  border-radius: 999px;
  transition: transform 0.15s var(--es-ease), color 0.15s var(--es-ease), background-color 0.15s var(--es-ease);
}

.az-index-item:active {
  color: var(--es-primary);
  transform: scale(1.35);
}

.az-index-item.active {
  color: #fff;
  transform: scale(1.1);
  background: linear-gradient(135deg, var(--es-grad-a), var(--es-primary));
}

@media (max-width: 375px) {
  .az-index-item { font-size: 13px; width: 22px; }
}

/* 标签模式·多标签筛选面板 — soft white card */
.tag-filter-panel {
  margin: 4px 4px 12px;
  background: var(--es-surface);
  border-radius: var(--es-r-card);
  border: 1px solid var(--es-hair-soft);
  box-shadow: var(--es-shadow-soft);
  overflow: hidden;
}
.tag-filter-panel .tfp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--es-ink);
  cursor: pointer;
}
.tag-filter-panel .tfp-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--es-ink);
  .van-icon { color: var(--es-primary); }
}
.tag-filter-panel .tfp-summary {
  color: var(--es-ink-3);
  font-size: 12px;
  font-weight: 500;
  margin-left: 4px;
}
.tag-filter-panel .tfp-right {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--es-ink-3);
}
.tag-filter-panel .tfp-clear {
  color: var(--es-primary);
  font-size: 13px;
  font-weight: 600;
}
.tag-filter-panel .tfp-body {
  padding: 4px 16px 14px;
  border-top: 1px solid var(--es-hair-soft);
}
.tag-filter-panel .tfp-tip {
  font-size: 12px;
  color: var(--es-ink-3);
  margin-bottom: 10px;
  line-height: 1.5;
}

/* ---- shared van overrides for this page ---- */
:deep(.van-action-sheet) {
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
}
:deep(.van-action-sheet__item) {
  font-weight: 600;
  color: var(--es-ink);
}
:deep(.van-action-sheet__cancel) {
  color: var(--es-ink-2);
}

/* ---- 多选入口 (下划线 Tab 行最右端, 小文字按钮) ---- */
.select-toggle {
  flex: 0 0 auto;
  align-self: center;
  margin-bottom: 4px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  color: var(--es-ink-2);
  background: transparent;
  transition: color 0.2s var(--es-ease), background-color 0.2s var(--es-ease);

  &.active {
    color: var(--es-primary);
    background: rgba(25, 137, 250, .1);
  }
  &:active { background: rgba(25, 137, 250, .07); }
}
@media (max-width: 375px) {
  .view-tabs-track { gap: 16px; }
  .select-toggle { padding: 5px 8px; font-size: 12px; }
}

/* ---- 行左滑容器: van-swipe-cell, right 插槽露出 [状态][标签][删除] ---- */
.swipe-cell {
  display: block;
  background: var(--es-surface);
}
/* van-swipe-cell 默认插槽: checkbox + van-cell 横排 */
.swipe-cell-body {
  display: flex;
  align-items: center;
  background: var(--es-surface);
}
.swipe-cell-body .van-cell {
  flex: 1;
  min-width: 0;
  background: transparent;
}
.row-checkbox {
  flex: 0 0 auto;
  padding-left: 16px;
}
/* 左滑露出的三按钮区: 状态(蓝) / 标签(青) / 删除(红), 整高贴合行 */
.row-actions {
  display: flex;
  height: 100%;
}
.ra-btn {
  height: 100%;
  min-height: 100%;
  padding: 0 16px;
  border: none;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: filter 0.15s var(--es-ease);

  &:active { filter: brightness(0.92); }
}
.ra-status { background: var(--es-primary, #1989fa); }
.ra-tag    { background: #ff9800; }
.ra-delete { background: #ee0a24; }

/* ---- 多选底部操作条 (浮在 50px tabbar 之上) ---- */
.select-action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(50px + env(safe-area-inset-bottom, 0px));
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--es-surface);
  border-top: 1px solid var(--es-hair);
  box-shadow: 0 -8px 24px -12px rgba(20, 30, 50, 0.22);

  .sab-left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    color: var(--es-ink);
    font-size: 14px;
    font-weight: 600;
    flex: 0 0 auto;
  }
  .sab-count {
    flex: 1;
    text-align: center;
    color: var(--es-ink-2);
    font-size: 14px;
    font-weight: 600;
  }
  .sab-delete {
    flex: 0 0 auto;
    padding: 9px 22px;
    border-radius: 999px;
    background: #ee0a24;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
    transition: opacity 0.2s var(--es-ease), transform 0.15s var(--es-ease);

    &:active:not(.disabled) { transform: scale(0.96); }
    &.disabled {
      opacity: 0.45;
      pointer-events: none;
    }
  }
}
.select-bar-slide-enter-active,
.select-bar-slide-leave-active { transition: transform 0.28s var(--es-ease), opacity 0.28s var(--es-ease); }
.select-bar-slide-enter-from,
.select-bar-slide-leave-to { transform: translateY(100%); opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .dictionary-header .header-glow { animation: none !important; }
  .add-word-fab, .resource-toggle, .view-tab .vt-label, .view-tab .vt-underline,
  .az-index-item, .word-item, .status-indicator, .select-toggle,
  .ra-btn, .sab-delete { transition: none !important; }
}
</style>
