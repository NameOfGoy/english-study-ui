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
        <!-- 右侧书签切换：单词 / 短语 -->
        <div class="resource-switcher">
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
                  <!-- {{ item.translation || '暂无翻译' }} -->
                </div>
              </template>
            </van-cell>
            
            <!-- 状态模式调试信息已移除 -->
            
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
                  <!-- {{ item.translation || '暂无翻译' }} -->
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
                    :style="{ backgroundColor: tag.color }"
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
                    :style="{ backgroundColor: tag.color }"
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
        <div v-else-if="selectedWord" key="word-detail" class="word-detail">
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

        <div v-else-if="selectedPhrase" key="phrase-detail" class="phrase-detail">
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
              <h1 class="nav-title">短语详情</h1>
              <div class="nav-subtitle">Phrase Details</div>
            </div>
            <div class="nav-right"></div>
          </div>

          <van-card class="word-card">
            <template #title>
              <div class="word-title">
                <h2>{{ selectedPhrase.word }}</h2>
              </div>
            </template>

            <template #desc>
              <div class="phrase-detail-section">
                <div v-if="selectedPhrase.pronunciation" class="phrase-pronunciation-section">
                  <h3 class="phrase-section-title">发音</h3>
                  <div class="pronunciation-row">
                    <div class="audio-btn-container">
                      <van-button
                        size="mini"
                        type="default"
                        @click="playAudio(selectedPhrase.pronunciation, 'phrase')"
                        class="play-btn"
                        :class="{ 'playing': audioPlaying['phrase'] }"
                      >
                        🔊
                      </van-button>
                      <div v-if="audioPlaying['phrase']" class="sound-waves">
                        <div class="wave wave-1"></div>
                        <div class="wave wave-2"></div>
                        <div class="wave wave-3"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="phrase-translation-section">
                  <h3 class="phrase-section-title">释义</h3>
                  <p class="definition-text">{{ selectedPhrase.translation || '暂无释义' }}</p>
                </div>

                <div class="picture-action">
                  <van-button
                    size="small"
                    round
                    type="primary"
                    class="picture-toggle-btn"
                    icon="photo-o"
                    @click="openPhrasePictureModal"
                  >
                    查看图片
                  </van-button>
                </div>

                <div v-if="selectedPhrase.example && selectedPhrase.example.length" class="examples-section">
                  <h4 class="examples-title">例句</h4>
                  <div v-for="(example, exIndex) in selectedPhrase.example" :key="exIndex" class="example-item">
                    <p class="example-text">{{ example.example }}</p>
                    <p class="example-translation">{{ example.translation }}</p>
                  </div>
                </div>

                <div v-if="selectedPhrase.picture" class="picture-section">
                  <van-image :src="getResourceUrl(selectedPhrase.picture)" fit="cover" class="modal-picture" />
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
          <h3>{{ selectedWord ? '词性图片' : '短语图片' }}</h3>
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
    <van-popup
      v-model:show="showSearchModal"
      position="center"
      :style="{ width: '92%', maxWidth: '420px', borderRadius: '16px' }"
      :close-on-click-overlay="false"
    >
      <div class="search-modal">
        <div class="modal-header">
          <h3>搜索</h3>
          <van-icon name="cross" @click="closeSearchModal" class="close-btn" />
        </div>
        <div class="modal-content">
          <van-field v-model="searchQuery" label="前缀" placeholder="输入英文前缀" clearable @input="onSearchInput" />
          <div class="search-results">
            <van-loading v-if="searching" size="20px" vertical>搜索中...</van-loading>
            <van-empty v-else-if="searchQuery && searchResults.length === 0" description="暂无结果" />
            <div v-else>
              <van-cell
                v-for="item in searchResults"
                :key="item.id"
                :title="item.word"
                is-link
                @click="selectSearchResult(item)"
                class="word-item"
              />
            </div>
          </div>
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
    <div v-if="!selectedWord && resourceType === 'word' && currentDisplayMode === 'word'" class="add-word-fab" @click="openAddWordModal">
      <van-icon name="plus" size="24" />
    </div>
    <div v-if="!selectedWord && !selectedPhrase && resourceType === 'word' && currentDisplayMode === 'word'" class="search-fab" @click="openSearchModal">
      <van-icon name="search" size="22" />
    </div>
    <!-- 添加短语浮动按钮 -->
    <div v-if="!selectedWord && !selectedPhrase && resourceType === 'phrase' && currentDisplayMode === 'word'" class="add-word-fab" @click="openAddPhraseModal">
      <van-icon name="plus" size="24" />
    </div>
    <div v-if="!selectedWord && !selectedPhrase && resourceType === 'phrase' && currentDisplayMode === 'word'" class="search-fab" @click="openSearchModal">
      <van-icon name="search" size="22" />
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
    
    <!-- 添加短语弹窗 -->
    <van-popup
      v-model:show="showAddPhraseModal"
      position="center"
      :style="{ width: '90%', maxWidth: '400px', borderRadius: '16px' }"
      :close-on-click-overlay="false"
    >
      <div class="add-word-modal">
        <div class="modal-header">
          <h3>添加短语</h3>
          <van-icon name="cross" @click="closeAddPhraseModal" class="close-btn" />
        </div>
        
        <div class="modal-content">
          <van-form @submit="submitAddPhrase">
            <van-field
              v-model="addPhraseForm.phrase"
              name="phrase"
              label="短语"
              placeholder="请输入英文短语"
              :rules="[{ required: true, message: '请输入短语' }]"
              clearable
            />
            
            <van-field name="generatePhrasePicture" label="生成图片">
              <template #input>
                <van-checkbox v-model="addPhraseForm.isGeneratePicture">自动生成图片</van-checkbox>
              </template>
            </van-field>
            
            <div class="modal-actions">
              <van-button
                type="default"
                @click="closeAddPhraseModal"
                class="action-btn cancel-btn"
              >
                取消
              </van-button>
              <van-button
                type="primary"
                native-type="submit"
                :loading="addingPhrase"
                :disabled="addingPhrase"
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
          <h3>{{ currentEditType === 'phrase' ? '编辑短语状态' : '编辑单词状态' }}</h3>
          <van-icon name="cross" @click="closeStatusModal" class="close-btn" />
        </div>
        
        <div class="modal-content">
          <div class="word-info">
            <h4>{{ currentEditWord?.word }}</h4>
          </div>
          
          <van-form @submit="submitStatusUpdate">
            <van-field name="status" :label="currentEditType === 'phrase' ? '短语状态' : '单词状态'">
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

    <!-- 短语编辑弹窗 -->
    <van-popup
      v-model:show="showPhraseModal"
      position="center"
      :style="{ width: '90%', maxWidth: '500px', borderRadius: '16px' }"
      :close-on-click-overlay="false"
    >
      <div class="phrase-modal">
        <div class="modal-header">
          <h3>{{ editingPhrase ? '编辑短语' : '添加短语' }}</h3>
          <van-icon name="cross" @click="closePhraseModal" class="close-btn" />
        </div>
        
        <div class="modal-content">
          <van-form @submit="submitPhrase">
            <van-field
              v-model="phraseForm.phrase"
              name="phrase"
              label="短语"
              placeholder="请输入英文短语"
              :rules="[{ required: true, message: '请输入短语' }]"
              clearable
            />
            
            <van-field
              v-model="phraseForm.translation"
              name="translation"
              label="中文翻译"
              type="textarea"
              placeholder="请输入中文释义"
              autosize
              clearable
            />
            
            <van-field
              v-model="phraseForm.pronunciation"
              name="pronunciation"
              label="发音"
              placeholder="如 /ˈfreɪz/"
              clearable
            />
            
            <div class="examples-section">
              <h5>例句</h5>
              <div v-for="(ex, idx) in phraseForm.example" :key="idx" class="example-row">
                <van-field v-model="ex.example" :name="`example-${idx}`" label="英文" placeholder="示例英文句子" />
                <van-field v-model="ex.translation" :name="`translation-${idx}`" label="中文" placeholder="对应中文翻译" />
                <van-button size="small" type="danger" plain @click="removeExample(idx)">删除</van-button>
              </div>
              <van-button size="small" type="primary" plain @click="addExample">添加例句</van-button>
            </div>
            
            <div class="picture-section">
              <h5>图片</h5>
              <div class="picture-preview" v-if="phraseForm.picture">
                <img :src="getResourceUrl(phraseForm.picture)" alt="短语图片" />
              </div>
              <div class="picture-actions">
                <van-button size="small" type="primary" plain @click="selectPhraseImage">选择并上传图片</van-button>
                <van-checkbox v-model="phraseForm.isGeneratePicture">自动生成图片</van-checkbox>
              </div>
            </div>
            
            <div class="modal-actions">
              <van-button
                type="default"
                @click="closePhraseModal"
                class="action-btn cancel-btn"
              >
                取消
              </van-button>
              <van-button
                type="primary"
                native-type="submit"
                class="action-btn submit-btn"
              >
                {{ editingPhrase ? '保存' : '添加' }}
              </van-button>
            </div>
          </van-form>
          
          <div v-if="editingPhrase" class="danger-zone">
            <van-button type="danger" plain @click="deletePhrase">删除该短语</van-button>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getWordList, getWordDetail, generateWordPicture, updateWordPicture, addWord, getWordStatusList, updateWordStatus, getWordTagList, updateWordTag, getWordPhraseList, getWordPhraseDetail, addWordPhrase, updateWordPhrase, deleteWordPhrase, generatePhrasePicture, updatePhrasePicture } from '@/api/dictionary'
import { getTagList, addTag, updateTag } from '@/api/tag'
import { uploadFile, selectFiles } from '@/api/file'
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
    const selectedPhrase = ref(null)
    const scrollContainer = ref(null)
    const lastScrollTop = ref(0)
    const transitionName = ref('page-slide')
    
    // 显示模式切换相关
    const resourceType = ref('word') // 'word' 或 'phrase'
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
    // 短语分页与加载更多
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
    
    // 添加短语相关
    const showAddPhraseModal = ref(false)
    const addingPhrase = ref(false)
    const addPhraseForm = reactive({
      phrase: '',
      isGeneratePicture: false
    })
    const showSearchModal = ref(false)
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
    
    // 显示模式切换（根据右侧书签选择资源类型）
    const switchDisplayMode = async (mode) => {
      currentDisplayMode.value = mode
      // 退出详情页
      selectedWord.value = null
      selectedPhrase.value = null
      
      if (mode === 'status') {
        if (resourceType.value === 'word') {
          if (statusWords.value.length === 0) {
            await loadStatusData()
          } else {
            associateStatusAndTagsToWords()
          }
        } else {
          // 短语：加载基础数据与状态数据
          if (phraseList.value.length === 0) {
            await loadPhrases()
          }
          await loadPhraseStatusData()
        }
      } else if (mode === 'tag') {
        if (resourceType.value === 'word') {
          if (tagWords.value.length === 0) {
            await loadTagData()
          } else {
            associateStatusAndTagsToWords()
          }
        } else {
          if (phraseList.value.length === 0) {
            await loadPhrases()
          }
          await loadPhraseTagData()
        }
      } else if (mode === 'word') {
        if (resourceType.value === 'word') {
          if (wordList.value.length === 0) {
            await initializeWordList()
          } else {
            classifyWordsByLetter(wordList.value)
          }
        } else {
          if (phraseList.value.length === 0) {
            await loadPhrases()
          }
        }
      }
    }
    
    // 资源书签切换
    const switchResourceType = async (type) => {
      if (resourceType.value === type) return
      resourceType.value = type
      selectedWord.value = null
      selectedPhrase.value = null
      transitionName.value = 'list-slide'
      await nextTick()
      if (scrollContainer.value && lastScrollTop.value) {
        scrollContainer.value.scrollTop = lastScrollTop.value
      }
      if (type === 'word') {
        if (wordList.value.length === 0) {
          await initializeWordList()
        } else if (currentDisplayMode.value === 'word') {
          classifyWordsByLetter(wordList.value)
        } else if (currentDisplayMode.value === 'status') {
          if (statusWords.value.length === 0) await loadStatusData()
          else associateStatusAndTagsToWords()
        } else if (currentDisplayMode.value === 'tag') {
          if (tagWords.value.length === 0) await loadTagData()
          else associateStatusAndTagsToWords()
        }
      } else {
        if (phraseList.value.length === 0) await loadPhrases()
        if (currentDisplayMode.value === 'status') {
          await loadPhraseStatusData()
        } else if (currentDisplayMode.value === 'tag') {
          await loadPhraseTagData()
        }
      }
    }

    // 打开状态编辑弹窗
    const openStatusModal = (word) => {
      currentEditWord.value = word
      currentEditType.value = resourceType.value
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

        const targetId = currentEditWord.value.id
        const typeNum = currentEditType.value === 'phrase' ? 2 : 1
        
        // 调用真实API更新状态（根据资源类型传递 word_type）
        const response = await updateWordStatus({
          word_id: targetId,
          status: parseInt(statusForm.status),
          word_type: typeNum
        })
        
        if (response.code === 0) {
          // 先更新本地数据以立即反馈
          if (currentEditType.value === 'word') {
            const wordIndex = allWords.value.findIndex(w => w.id === targetId)
            if (wordIndex !== -1) {
              allWords.value[wordIndex].status = parseInt(statusForm.status)
              wordsByLetter.value = categorizeWordsByLetter(allWords.value)
            }
            // 更新 statusWords 的本地缓存
            const statusIndex = statusWords.value.findIndex(w => (w.word_id ?? w.wordId) === targetId)
            if (statusIndex !== -1) {
              statusWords.value[statusIndex].status = parseInt(statusForm.status)
            }
          } else {
            const phraseIndex = phraseList.value.findIndex(p => p.id === targetId)
            if (phraseIndex !== -1) {
              phraseList.value[phraseIndex].status = parseInt(statusForm.status)
              phrasesByLetter.value = categorizePhrasesByLetter(phraseList.value)
            }
            const statusIndex = statusPhrases.value.findIndex(p => (p.word_id ?? p.wordId) === targetId)
            if (statusIndex !== -1) {
              statusPhrases.value[statusIndex].status = parseInt(statusForm.status)
            }
          }

          // 保存成功后，重新获取该资源的最新状态并同步到页面
          try {
            const refreshResp = await getWordStatusList(targetId, typeNum)
            if (refreshResp.code === 0) {
              const refreshed = (refreshResp.data || []).find(item => (item.word_id ?? item.wordId) === targetId)
              if (refreshed) {
                const refreshedStatus = Number(refreshed.status ?? refreshed.state ?? 0)
                if (currentEditType.value === 'word') {
                  const idx = allWords.value.findIndex(w => w.id === targetId)
                  if (idx !== -1) {
                    allWords.value[idx].status = refreshedStatus
                  }
                  const sIdx = statusWords.value.findIndex(w => (w.word_id ?? w.wordId) === targetId)
                  if (sIdx !== -1) {
                    statusWords.value[sIdx] = { ...statusWords.value[sIdx], status: refreshedStatus }
                  } else {
                    statusWords.value.push({ word_id: targetId, status: refreshedStatus })
                  }
                  // 重新关联与分类，确保 UI 更新
                  associateStatusAndTagsToWords()
                } else {
                  const pIdx = phraseList.value.findIndex(p => p.id === targetId)
                  if (pIdx !== -1) {
                    phraseList.value[pIdx].status = refreshedStatus
                  }
                  const spIdx = statusPhrases.value.findIndex(p => (p.word_id ?? p.wordId) === targetId)
                  if (spIdx !== -1) {
                    statusPhrases.value[spIdx] = { ...statusPhrases.value[spIdx], status: refreshedStatus }
                  } else {
                    statusPhrases.value.push({ word_id: targetId, status: refreshedStatus })
                  }
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
      currentEditType.value = resourceType.value
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
        
        const targetId = currentEditWord.value.id
        const typeNum = currentEditType.value === 'phrase' ? 2 : 1
        
        // 调用真实API更新标签（根据资源类型传递 word_type）
        const response = await updateWordTag({
          word_id: targetId,
          tags: tagForm.selectedTags.map(tag => tag.id),
          word_type: typeNum
        })
        
        if (response.code === 0) {
          // 更新本地数据
          if (currentEditType.value === 'word') {
            const wordIndex = allWords.value.findIndex(w => w.id === targetId)
            if (wordIndex !== -1) {
              allWords.value[wordIndex].tags = [...tagForm.selectedTags]
              // 重新分类单词
              wordsByLetter.value = categorizeWordsByLetter(allWords.value)
            }
            // 如果当前在标签模式，也更新标签数据
            if (currentDisplayMode.value === 'tag') {
              const tagIndex = tagWords.value.findIndex(w => (w.word_id ?? w.wordId) === targetId || w.id === targetId)
              if (tagIndex !== -1) {
                tagWords.value[tagIndex].tags = [...tagForm.selectedTags]
              }
            }
            associateStatusAndTagsToWords()
          } else {
            const phraseIndex = phraseList.value.findIndex(p => p.id === targetId)
            if (phraseIndex !== -1) {
              phraseList.value[phraseIndex].tags = [...tagForm.selectedTags]
              // 重新分类短语
              phrasesByLetter.value = categorizePhrasesByLetter(phraseList.value)
            }
            if (currentDisplayMode.value === 'tag') {
              const tagIndex = tagPhrases.value.findIndex(p => (p.word_id ?? p.wordId) === targetId)
              if (tagIndex !== -1) {
                tagPhrases.value[tagIndex].tags = [...tagForm.selectedTags]
              }
            }
            associateStatusAndTagsToPhrases()
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
    
    // 按首字母分类短语
    const categorizePhrasesByLetter = (phrases) => {
      const categorized = {}
      phrases.forEach(item => {
        const text = item.phrase || item.word || item.content || ''
        const firstLetter = (text.trim().charAt(0) || '#').toLowerCase()
        const letter = /[a-z]/.test(firstLetter) ? firstLetter : '#'
        if (!categorized[letter]) {
          categorized[letter] = []
        }
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
          currentOffset.value += data.length
        } else {
          allWords.value = data
          currentOffset.value = data.length
        }
        
        // 2. 更新分组渲染
        wordsByLetter.value = categorizeWordsByLetter(allWords.value)
        console.log(`🔍 按字母分类结果:`, Object.keys(wordsByLetter.value).map(letter => `${letter}: ${wordsByLetter.value[letter].length}`).join(', '))
        
        // 3. 更新分页信息（是否还有更多）
        hasMoreWords.value = allWords.value.length < total
        console.log(`📈 分页状态: currentOffset=${currentOffset.value}, hasMoreWords=${hasMoreWords.value}`)
      } catch (error) {
        console.error('❌ 加载单词失败:', error)
        showToast('加载单词失败，请稍后重试')
      } finally {
        loadingMore.value = false
        console.log('🧯 设置 loadingMore = false')
      }
    }
    
    // 加载短语列表
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
          if (list.length < PAGE_SIZE) {
            hasMorePhrases.value = false
          }
        } else {
          showToast(resp.message || '加载短语列表失败')
        }
      } catch (err) {
        console.error('加载短语失败:', err)
        showToast('网络错误，请稍后重试')
      } finally {
        if (append) {
          loadingMorePhrases.value = false
        } else {
          loadingPhraseData.value = false
        }
      }
    }
    
    const loadMorePhrases = async () => {
      if (!hasMorePhrases.value || loadingMorePhrases.value) return
      await loadPhrases(true)
    }

    // 打开短语编辑弹窗（支持新增与编辑）
    const openPhraseModal = async (item) => {
      try {
        // 重置表单
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

    const addExample = () => {
      phraseForm.example.push({ example: '', translation: '' })
    }

    const removeExample = (index) => {
      if (index >= 0 && index < phraseForm.example.length) {
        phraseForm.example.splice(index, 1)
      }
    }

    // 选择并上传短语图片
    const selectPhraseImage = async () => {
      try {
        const files = await selectFiles('image/*', false)
        const file = files[0]
        if (!file) {
          showToast('请先选择图片')
          return
        }
        // 验证
        if (!file.type.startsWith('image/')) {
          showToast('请选择图片文件')
          return
        }
        if (file.size > 5 * 1024 * 1024) {
          showToast('图片大小不能超过5MB')
          return
        }
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
      } catch (error) {
        console.error('短语图片上传失败:', error)
        showToast(error.message || '图片上传失败')
      }
    }

    // 提交新增或更新
    const submitPhrase = async () => {
      const payload = {
        phrase: (phraseForm.phrase || '').trim(),
        translation: (phraseForm.translation || '').trim(),
        pronunciation: (phraseForm.pronunciation || '').trim(),
        example: (phraseForm.example || []).map(e => ({ example: e.example || '', translation: e.translation || '' })),
        picture: phraseForm.picture || ''
      }

      if (!payload.phrase) {
        showToast('请输入短语')
        return
      }

      try {
        if (editingPhrase.value) {
          const resp = await updateWordPhrase({ id: phraseForm.id, ...payload })
          if (resp.code === 0) {
            // 更新本地列表项（SimpleWord）
            const idx = phraseList.value.findIndex(p => p.id === phraseForm.id)
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
          const resp = await addWordPhrase({ ...payload, is_generate_picture: !!phraseForm.isGeneratePicture })
          if (resp.code === 0) {
            showToast('短语添加成功')
            // 重新加载短语列表
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
          // 从本地列表移除并重新分类
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
    
    // 获取按状态过滤后的短语（优先显示已设置状态的）
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

    // 将状态和标签数据关联到对应的短语
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

    // 加载短语状态数据
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

    // 加载短语标签数据
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
        if (scrollProgress > 0.8) {
          if (currentDisplayMode.value === 'word' && hasMoreWords.value && !loadingMore.value) {
            loadMoreWords()
          } else if (currentDisplayMode.value === 'phrase' && hasMorePhrases.value && !loadingMorePhrases.value) {
            loadMorePhrases()
          }
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
    
    // 预加载短语相关资源
    const preloadPhraseResources = async (phraseData) => {
      if (!phraseData) return
      const preloadPromises = []
      // 预加载发音音频
      if (phraseData.pronunciation) {
        preloadPromises.push(preloadAudio(phraseData.pronunciation, `${phraseData.id}_phrase`))
      }
      // 预加载图片资源
      if (phraseData.picture) {
        preloadPromises.push(preloadImage(phraseData.picture))
      }
      Promise.allSettled(preloadPromises).then(() => {
        console.log('短语资源预加载完成')
      })
    }
    
    // 选择单词
    const selectWord = async (wordId) => {
      try {
        if (scrollContainer.value) {
          lastScrollTop.value = scrollContainer.value.scrollTop
        }
        transitionName.value = 'page-slide'
        const response = await getWordDetail(wordId)
        if (response.code === 0) {
          selectedWord.value = response.data
          showPictures.value = {}
          // 立即预加载音频和图片资源
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

    // 选择短语
    const selectPhrase = async (phraseId) => {
      try {
        if (scrollContainer.value) {
          lastScrollTop.value = scrollContainer.value.scrollTop
        }
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
          // 预加载短语的音频和图片资源
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

    // 返回列表
    const goBack = () => {
      selectedWord.value = null
      selectedPhrase.value = null
      // 在列表重新渲染后恢复滚动位置
      nextTick(() => {
        if (scrollContainer.value) {
          scrollContainer.value.scrollTop = lastScrollTop.value || 0
        }
      })
    }
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
    const onSearchInput = () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer)
      }
      if (!searchQuery.value) {
        searchResults.value = []
        return
      }
      searchDebounceTimer = setTimeout(async () => {
        try {
          searching.value = true
          let resp
          if (searchType.value === 'word') {
            const params = { word_prefix: searchQuery.value, limit: 50 }
            resp = await getWordList(params)
          } else {
            const params = { phrase_prefix: searchQuery.value, limit: 50 }
            resp = await getWordPhraseList(params)
          }
          if (resp && (resp.code === 0 || Array.isArray(resp))) {
            const list = resp.data || resp || []
            searchResults.value = list
          } else {
            searchResults.value = []
          }
        } catch (e) {
          searchResults.value = []
        } finally {
          searching.value = false
        }
      }, 500)
    }
    const selectSearchResult = (item) => {
      if (searchType.value === 'word') {
        selectWord(item.id)
      } else {
        selectPhrase(item.id)
      }
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
      // 如果当前在详情页面（单词或短语），右滑返回列表
      if (selectedWord.value || selectedPhrase.value) {
        transitionName.value = 'page-slide-right'
        goBack()
        if (searchActive.value) {
          showSearchModal.value = true
        }
        nextTick(() => {
          if (scrollContainer.value) {
            scrollContainer.value.scrollTop = lastScrollTop.value || 0
          }
        })
        return
      }

      // 在列表页面，右滑切换到上一个显示模式（单词 ← 状态 ← 标签）
      const modes = displayModes.value.map(m => m.value)
      const currentIndex = modes.indexOf(currentDisplayMode.value)
      const prevIndex = (currentIndex - 1 + modes.length) % modes.length
      const prevMode = modes[prevIndex]
      switchDisplayMode(prevMode)
    }

    const handleLeftSwipe = () => {
      // 只在列表页面处理左滑手势：切换到下一个显示模式（单词 → 状态 → 标签）
      if (!selectedWord.value && !selectedPhrase.value) {
        const modes = displayModes.value.map(m => m.value)
        const currentIndex = modes.indexOf(currentDisplayMode.value)
        const nextIndex = (currentIndex + 1) % modes.length
        const nextMode = modes[nextIndex]
        switchDisplayMode(nextMode)
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

    // 打开短语图片弹窗
    const openPhrasePictureModal = () => {
      currentPosIndex.value = -1
      currentPicture.value = selectedPhrase.value?.picture || ''
      originalPicture.value = selectedPhrase.value?.picture || ''
      generatedPicture.value = ''
      showActionModal.value = false
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
         if (selectedWord.value && currentPosIndex.value >= 0) {
           const pos = selectedWord.value.pos[currentPosIndex.value]
           const response = await generateWordPicture(pos.id)
           console.log('生成图片响应:', response)
           if (response.link) {
             generatedPicture.value = response.link
             currentPicture.value = response.link
             showActionModal.value = true
             showToast('图片生成成功')
           }
         } else if (selectedPhrase.value) {
           const response = await generatePhrasePicture(selectedPhrase.value.id)
           console.log('生成短语图片响应:', response)
           if (response.link) {
             generatedPicture.value = response.link
             currentPicture.value = response.link
             showActionModal.value = true
             showToast('图片生成成功')
           }
         }
       } catch (error) {
         console.error('生成图片失败:', error)
       } finally {
         generatingPicture.value = false
       }
     }
    
    // 应用图片
     const applyPicture = async () => {
       try {
         applyingPicture.value = true
         if (selectedWord.value && currentPosIndex.value >= 0) {
           const pos = selectedWord.value.pos[currentPosIndex.value]
           const response = await updateWordPicture({
             word_pos_id: pos.id,
             picture: generatedPicture.value
           })
           console.log('应用图片响应:', response)
           selectedWord.value.pos[currentPosIndex.value].picture = generatedPicture.value
           currentPicture.value = generatedPicture.value
           originalPicture.value = generatedPicture.value
           showToast('图片应用成功')
           showActionModal.value = false
         } else if (selectedPhrase.value) {
           const response = await updatePhrasePicture({
             id: selectedPhrase.value.id,
             link: generatedPicture.value
           })
           console.log('应用短语图片响应:', response)
           // 成功时更新本地数据
           selectedPhrase.value.picture = generatedPicture.value
           currentPicture.value = generatedPicture.value
           originalPicture.value = generatedPicture.value
           showToast('图片应用成功')
           showActionModal.value = false
         }
       } catch (error) {
         console.error('应用图片失败:', error)
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
    
    // 打开添加短语弹窗
    const openAddPhraseModal = () => {
      // 重置表单
      addPhraseForm.phrase = ''
      addPhraseForm.isGeneratePicture = false
      showAddPhraseModal.value = true
    }
    
    // 关闭添加短语弹窗
    const closeAddPhraseModal = () => {
      showAddPhraseModal.value = false
      addPhraseForm.phrase = ''
      addPhraseForm.isGeneratePicture = false
    }
    
    // 提交添加短语
    const submitAddPhrase = async () => {
      if (!addPhraseForm.phrase.trim()) {
        showToast('请输入短语')
        return
      }
      
      try {
        addingPhrase.value = true
        const resp = await addWordPhrase({
          phrase: addPhraseForm.phrase.trim(),
          is_generate_picture: addPhraseForm.isGeneratePicture
        })
        if (resp.code === 0) {
          showToast('短语添加成功')
          closeAddPhraseModal()
          await loadPhrases(false)
        } else {
          showToast(resp.message || '添加失败，请重试')
        }
      } catch (error) {
        console.error('添加短语失败:', error)
      } finally {
        addingPhrase.value = false
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
        
        // 构建缓存键（兼容单词与短语）
        const currentId = selectedWord.value?.id || selectedPhrase.value?.id
        const cacheKey = `${currentId}_${index}`
        
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
        
        // 生成上传路径，使用原始文件的扩展名（根据上下文区分单词/短语）
        let uploadPath = ''
        if (selectedWord.value && currentPosIndex.value >= 0) {
          const pos = selectedWord.value.pos[currentPosIndex.value]
          uploadPath = generateUploadPath(selectedWord.value.word, pos.pos, originalExtension)
        } else if (selectedPhrase.value) {
          const safePhrase = (selectedPhrase.value.word || 'phrase').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
          uploadPath = `dictionary/phrase/${safePhrase}_${Date.now()}.${originalExtension}`
        }
        
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
      selectedPhrase,
      scrollContainer,
      transitionName,
      
      // 显示模式相关
      resourceType,
      currentDisplayMode,
      displayModes,
      
      // 状态编辑相关
      showStatusModal,
      currentEditType,
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
      
      // 状态、标签、短语数据
      statusWords,
      tagWords,
      availableTags,
      loadingStatusData,
      loadingTagData,
      // 短语数据
      phraseList,
      phrasesByLetter,
      loadingPhraseData,
      hasMorePhrases,
      loadingMorePhrases,
      lettersToLoop,
      
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

      // 添加短语相关
      showAddPhraseModal,
      addingPhrase,
      addPhraseForm,

      showSearchModal,
      searchQuery,
      searchResults,
      searching,

      // 短语弹窗相关
      showPhraseModal,
      editingPhrase,
      phraseForm,
      
      // 方法
      getPosName,
      getExchangeName,
      getStatusText,
      getStatusClass,
      getFilteredWordsForStatus,
      getFilteredPhrasesForStatus,
      switchDisplayMode,
      switchResourceType,
      selectWord,
      selectPhrase,
      goBack,

      openSearchModal,
      closeSearchModal,
      onSearchInput,
      selectSearchResult,
      
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
      openPhrasePictureModal,
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

      // 添加短语相关方法
      openAddPhraseModal,
      closeAddPhraseModal,
      submitAddPhrase,

      // 短语编辑相关方法
      openPhraseModal,
      closePhraseModal,
      addExample,
      removeExample,
      selectPhraseImage,
      submitPhrase,
      deletePhrase,
      
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

.search-fab {
  position: fixed;
  bottom: 140px;
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
  color: #fff;
}
.search-fab:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6); }
.search-fab:active { transform: scale(0.95); }

.search-modal { background: #fff; border-radius: 16px; }
.search-modal .modal-header { display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid #eee; }
.search-modal .close-btn { font-size:20px; color:#999; }
.search-modal .modal-content { padding:16px; }
.search-results { margin-top:12px; }

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

/* 右侧书签切换：固定在屏幕右侧中间位置 */
.resource-switcher {
  position: fixed;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  z-index: 1000; /* 保证在内容之上可点击 */
}

.bookmark-option {
  min-width: 72px;
  padding: 10px 14px;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  background: rgba(0, 0, 0, 0.28);
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-align: center;
  cursor: pointer;
  backdrop-filter: blur(6px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  transition: all 0.25s ease;
  opacity: 0.85;
  user-select: none;

  &:hover {
    opacity: 0.95;
    transform: translateX(-2px);
  }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 10px 26px rgba(102, 126, 234, 0.35);
    opacity: 1;
  }
}

/* 小屏适配：稍微缩小书签尺寸，避免遮挡内容 */
@media (max-width: 375px) {
  .bookmark-option {
    min-width: 64px;
    padding: 8px 12px;
    font-size: 12px;
  }
}

.phrase-detail-section {
  margin-top: 16px;
  padding: 16px 18px;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
  box-shadow: 0 4px 12px rgba(91, 106, 255, 0.08);
  border: 1px solid rgba(91, 106, 255, 0.15);
}

.phrase-detail-section .phrase-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  font-size: 16px;
}

.phrase-detail-section .field-label {
  font-weight: 600;
  color: #4b5e7f;
  font-size: 16px;
}

.phrase-detail-section .field-value {
  font-weight: 600;
  color: #2e3a59;
  font-size: 18px;
}

.phrase-detail-section .examples-title {
  font-size: 18px;
  font-weight: 700;
  color: #334b99;
  margin-top: 12px;
}

.phrase-detail-section .example-text,
.phrase-detail-section .example-translation {
  font-size: 16px;
  line-height: 1.7;
}

.picture-action {
  margin: 10px 0 2px;
  display: flex;
  justify-content: flex-start;
}

.picture-toggle-btn {
  height: 28px;
  padding: 0 12px;
  border-radius: 14px;
}

/* 短语发音与释义样式 */
.phrase-pronunciation-section,
.phrase-translation-section {
  margin-top: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.phrase-section-title {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px 0;
  padding: 8px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.pronunciation-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 4px 0;
}

.definition-text {
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
}
</style>
