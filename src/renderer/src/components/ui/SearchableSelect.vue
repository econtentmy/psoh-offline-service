<template>
  <div class="searchable-select" ref="containerRef">
    <div 
      class="select-display form-control"
      :class="{ 'is-open': isOpen, 'has-value': modelValue }"
      @click="toggleDropdown"
    >
      <span v-if="selectedLabel" class="selected-text">{{ selectedLabel }}</span>
      <span v-else class="placeholder-text">{{ placeholder }}</span>
      <span class="dropdown-arrow">
        <span class="ri-arrow-down-s-line"></span>
      </span>
    </div>
    
    <div v-if="isOpen" class="dropdown-panel">
      <div class="search-box">
        <span class="ri-search-line search-icon"></span>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="searchPlaceholder"
          @keydown.escape="closeDropdown"
          @keydown.enter.prevent="selectHighlighted"
          @keydown.down.prevent="highlightNext"
          @keydown.up.prevent="highlightPrev"
        />
      </div>
      
      <div class="options-list">
        <div
          v-for="(option, index) in filteredOptions"
          :key="option.value"
          class="option-item"
          :class="{ 
            'is-selected': option.value === modelValue,
            'is-highlighted': index === highlightedIndex
          }"
          @click="selectOption(option)"
          @mouseenter="highlightedIndex = index"
        >
          {{ option.label }}
        </div>
        <div v-if="filteredOptions.length === 0" class="no-results">
          Tiada hasil dijumpai
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

interface Option {
  value: string
  label: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: Option[]
  placeholder?: string
  searchPlaceholder?: string
}>(), {
  placeholder: 'Sila Pilih',
  searchPlaceholder: 'Cari...'
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(0)
const containerRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(opt => 
    opt.label.toLowerCase().includes(query) ||
    opt.value.toLowerCase().includes(query)
  )
})

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected?.label || ''
})

function toggleDropdown(): void {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    highlightedIndex.value = 0
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
}

function closeDropdown(): void {
  isOpen.value = false
  searchQuery.value = ''
}

function selectOption(option: Option): void {
  emit('update:modelValue', option.value)
  closeDropdown()
}

function selectHighlighted(): void {
  if (filteredOptions.value.length > 0) {
    selectOption(filteredOptions.value[highlightedIndex.value])
  }
}

function highlightNext(): void {
  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++
  }
}

function highlightPrev(): void {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

// Reset highlight when search changes
watch(searchQuery, () => {
  highlightedIndex.value = 0
})

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent): void {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.searchable-select {
  position: relative;
  width: 100%;
}

.select-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  min-height: 38px;
  padding-right: 32px;
  position: relative;
}

.select-display.is-open {
  border-color: #137eff;
  box-shadow: 0 0 0 2px rgba(19, 126, 255, 0.15);
}

.selected-text {
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.placeholder-text {
  color: #6c757d;
}

.dropdown-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  transition: transform 0.2s;
}

.select-display.is-open .dropdown-arrow {
  transform: translateY(-50%) rotate(180deg);
}

.dropdown-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.search-box {
  position: relative;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #137eff;
}

.options-list {
  max-height: 200px;
  overflow-y: auto;
}

.option-item {
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.15s;
}

.option-item:hover,
.option-item.is-highlighted {
  background-color: #f0f7ff;
}

.option-item.is-selected {
  background-color: #e6f2ff;
  color: #137eff;
  font-weight: 500;
}

.no-results {
  padding: 12px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
