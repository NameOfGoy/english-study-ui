// 学习/复习/抽查/强化卡片中复用的图片编辑能力
// 处理: 生成/上传/搜索/裁剪/应用图片
import { ref } from 'vue'
import { showToast } from 'vant'
import {
  generateWordPicture, updateWordPicture,
  generatePhrasePicture, updatePhrasePicture
} from '@/api/dictionary'
import { uploadFile } from '@/api/file'
import { getUserId, getToken } from '@/utils/auth'

export function useCardPictureEditor() {
  // 当前正在编辑的卡片 + 图片索引 + 对应的 pos_id
  const editingCard = ref(null)
  const editingPicIndex = ref(0)
  const editingPosId = ref(0)

  // 模态框状态
  const showPictureModal = ref(false)
  const showCropModal = ref(false)
  const showImageSearchModal = ref(false)

  // 图片状态
  const currentPicture = ref('')      // 模态框里展示的图片
  const originalPicture = ref('')     // 用户编辑前的图片
  const generatedPicture = ref('')    // 待应用的新图片
  const hasPending = ref(false)
  const generatingPicture = ref(false)
  const applyingPicture = ref(false)
  const uploadingImage = ref(false)
  const selectedImageFile = ref(null)
  const selectedImageSrc = ref('')
  const imageSearchDefaultQuery = ref('')

  // 父级回调: 更新成功后，把 newPicture 回写到 currentCard.picture[index]
  let onAppliedCb = null
  const setOnApplied = (fn) => { onAppliedCb = fn }

  const isWord = () => editingCard.value?.word_type === 1
  const isPhrase = () => editingCard.value?.word_type === 2

  // 入口: 打开编辑模态
  // card: 当前 currentCard
  // index: 图片在 picture 数组中的索引
  const openEdit = (card, index) => {
    if (!card || !card.picture || !card.picture[index]) return
    const posIds = card.picture_pos_ids || []
    const posId = posIds[index] || 0
    if (!posId) {
      showToast('该图片缺少对应ID, 无法编辑')
      return
    }
    editingCard.value = card
    editingPicIndex.value = index
    editingPosId.value = posId
    currentPicture.value = card.picture[index]
    originalPicture.value = card.picture[index]
    generatedPicture.value = ''
    hasPending.value = false
    showPictureModal.value = true
  }

  const closePictureModal = () => {
    showPictureModal.value = false
    setTimeout(() => {
      generatedPicture.value = ''
      currentPicture.value = ''
      originalPicture.value = ''
      hasPending.value = false
      editingCard.value = null
      editingPicIndex.value = 0
      editingPosId.value = 0
    }, 300)
  }

  // ========== 操作: 生成 ==========
  const generatePicture = async () => {
    if (!editingPosId.value) return
    generatingPicture.value = true
    try {
      const resp = isWord()
        ? await generateWordPicture(editingPosId.value)
        : await generatePhrasePicture(editingPosId.value)
      if (resp && resp.link) {
        generatedPicture.value = resp.link
        currentPicture.value = resp.link
        hasPending.value = true
        showToast({ message: '图片生成成功', type: 'success' })
      } else {
        showToast(resp.message || '生成失败')
      }
    } catch (e) {
      showToast('网络错误')
    } finally {
      generatingPicture.value = false
    }
  }

  // ========== 操作: 上传 ==========
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
          if (!file.type.startsWith('image/')) { reject(new Error('请选择图片文件')); return }
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

  const openImageUpload = async () => {
    try {
      const file = await selectImageFile()
      selectedImageFile.value = file
      const reader = new FileReader()
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
  }

  const generateUploadPath = (word, posId, ext = 'png') => {
    const userId = getUserId() || 'unknown'
    const ts = Math.floor(Date.now() / 1000)
    if (isPhrase()) {
      const safe = (word || 'phrase').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
      return `dictionary/phrase/${safe}_${ts}.${ext}`
    }
    return `picture/user_word_${userId}/${word}/${posId}_${ts}.${ext}`
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
      const ext = (selectedImageFile.value.name.split('.').pop() || 'png').toLowerCase()
      const croppedFile = new File([blob], `cropped.${ext}`, { type: `image/${ext}` })
      const word = editingCard.value?.word || 'unknown'
      const path = generateUploadPath(word, editingPosId.value, ext)
      const result = await uploadFile(croppedFile, 'englishstudy', path)
      if (result.code === 0 && result.path) {
        closeCropModal()
        generatedPicture.value = result.path
        currentPicture.value = result.path
        hasPending.value = true
        showToast({ message: '上传成功，请确认是否应用', type: 'success' })
      } else {
        throw new Error(result.message || '上传失败')
      }
    } catch (err) {
      showToast(err.message || '上传失败')
    } finally {
      uploadingImage.value = false
    }
  }

  // ========== 操作: 搜索 ==========
  const openImageSearch = () => {
    imageSearchDefaultQuery.value = editingCard.value?.word || ''
    showImageSearchModal.value = true
  }

  const onImageSearchSelect = async (imageUrl) => {
    showImageSearchModal.value = false
    try {
      showToast({ message: '正在加载图片...', type: 'loading', duration: 0 })
      const proxyUrl = `/api/v1/file-service/proxy-image?url=${encodeURIComponent(imageUrl)}`
      const response = await fetch(proxyUrl, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      const blob = await response.blob()
      const ext = (blob.type.split('/')[1] || 'png')
      selectedImageFile.value = new File([blob], `search.${ext}`, { type: blob.type })
      const reader = new FileReader()
      reader.onload = (e) => {
        selectedImageSrc.value = e.target.result
        showCropModal.value = true
        showToast({ message: '请裁剪图片', type: 'success' })
      }
      reader.readAsDataURL(blob)
    } catch (err) {
      showToast('图片加载失败')
    }
  }

  // ========== 操作: 应用 / 恢复 ==========
  const applyPicture = async () => {
    if (!generatedPicture.value || !editingPosId.value) return
    applyingPicture.value = true
    try {
      const resp = isWord()
        ? await updateWordPicture({ word_pos_id: editingPosId.value, picture: generatedPicture.value })
        : await updatePhrasePicture({ id: editingPosId.value, link: generatedPicture.value })
      if (resp && resp.code === 0) {
        // 回写到 card.picture[index]
        if (onAppliedCb) onAppliedCb(editingPicIndex.value, generatedPicture.value)
        currentPicture.value = generatedPicture.value
        originalPicture.value = generatedPicture.value
        hasPending.value = false
        showToast({ message: '图片已应用', type: 'success' })
      } else {
        showToast(resp.message || '应用失败')
      }
    } catch (e) {
      showToast('网络错误')
    } finally {
      applyingPicture.value = false
    }
  }

  const restorePicture = () => {
    generatedPicture.value = ''
    currentPicture.value = originalPicture.value
    hasPending.value = false
    showToast('已恢复原图')
  }

  return {
    // state
    editingCard,
    editingPicIndex,
    editingPosId,
    showPictureModal,
    showCropModal,
    showImageSearchModal,
    currentPicture,
    generatedPicture,
    hasPending,
    generatingPicture,
    applyingPicture,
    uploadingImage,
    selectedImageSrc,
    imageSearchDefaultQuery,
    isWord,
    isPhrase,
    // actions
    openEdit,
    closePictureModal,
    generatePicture,
    openImageUpload,
    closeCropModal,
    confirmCrop,
    openImageSearch,
    onImageSearchSelect,
    applyPicture,
    restorePicture,
    setOnApplied,
  }
}
