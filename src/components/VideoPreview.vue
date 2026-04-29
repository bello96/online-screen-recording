<script setup lang="ts">
  defineProps<{
    videoUrl: string
    fileName: string
  }>()

  defineEmits<{ (e: 'reset'): void }>()
</script>

<template>
  <div class="video-preview">
    <video :src="videoUrl" controls class="video-preview__video" />
    <div class="video-preview__actions">
      <a :href="videoUrl" :download="fileName" class="video-preview__download">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4V16M12 16L7 11M12 16L17 11M5 20H19"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>下载视频</span>
      </a>
      <button class="video-preview__reset" @click="$emit('reset')">重新录制</button>
    </div>
  </div>
</template>

<style scoped>
  .video-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  .video-preview__video {
    width: 100%;
    max-width: 720px;
    border-radius: var(--radius-card);
    background-color: #000;
  }
  .video-preview__actions {
    display: flex;
    gap: 16px;
  }
  .video-preview__download {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    font-size: 14px;
    color: #fff;
    background-color: var(--color-primary);
    border-radius: var(--radius-button);
    text-decoration: none;
    transition: background-color var(--duration-fast);
  }
  .video-preview__download:hover {
    background-color: var(--color-primary-hover);
  }
  .video-preview__reset {
    padding: 10px 24px;
    font-size: 14px;
    color: var(--color-text);
    background-color: var(--color-step-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    transition: background-color var(--duration-fast);
  }
  .video-preview__reset:hover {
    background-color: var(--color-border);
  }
</style>
