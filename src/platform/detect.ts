// VK adds its launch params (vk_app_id, vk_user_id, sign, ...) to the game URL.
const vkLaunchParam = 'vk_app_id'

// isVK tells whether the game was launched inside VK, from location.search.
export function isVK(search: string): boolean {
  const params = new URLSearchParams(search)
  const inVK = params.has(vkLaunchParam)
  return inVK
}
