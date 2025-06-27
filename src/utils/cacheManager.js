// 缓存管理工具
const CACHE_KEY = 'jsdb_manager_data';
const CACHE_VERSION_KEY = 'jsdb_manager_cache_version';
const CURRENT_CACHE_VERSION = '1.0';

/**
 * 保存数据到localStorage
 * @param {Object} data - 要缓存的数据
 */
export const saveToCache = (data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      version: CURRENT_CACHE_VERSION
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    console.log('数据已缓存到本地存储');
  } catch (error) {
    console.error('缓存数据失败:', error);
    // 如果存储空间不足，尝试清理旧缓存
    if (error.name === 'QuotaExceededError') {
      clearCache();
      console.warn('存储空间不足，已清理缓存');
    }
  }
};

/**
 * 从localStorage加载数据
 * @returns {Object|null} 缓存的数据或null
 */
export const loadFromCache = () => {
  try {
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    
    // 检查缓存版本是否匹配
    if (cachedVersion !== CURRENT_CACHE_VERSION) {
      console.log('缓存版本不匹配，清理旧缓存');
      clearCache();
      return null;
    }
    
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (!cachedData) {
      return null;
    }
    
    const parsedCache = JSON.parse(cachedData);
    
    // 检查缓存是否过期（7天）
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
    if (Date.now() - parsedCache.timestamp > maxAge) {
      console.log('缓存已过期，清理缓存');
      clearCache();
      return null;
    }
    
    console.log('从本地存储加载数据');
    return parsedCache.data;
  } catch (error) {
    console.error('加载缓存数据失败:', error);
    clearCache();
    return null;
  }
};

/**
 * 清理缓存
 */
export const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_VERSION_KEY);
    console.log('缓存已清理');
  } catch (error) {
    console.error('清理缓存失败:', error);
  }
};

/**
 * 检查是否有缓存数据
 * @returns {boolean} 是否存在有效缓存
 */
export const hasCachedData = () => {
  try {
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (!cachedData || cachedVersion !== CURRENT_CACHE_VERSION) {
      return false;
    }
    
    const parsedCache = JSON.parse(cachedData);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
    
    return Date.now() - parsedCache.timestamp <= maxAge;
  } catch (error) {
    return false;
  }
};

/**
 * 获取缓存信息
 * @returns {Object|null} 缓存信息
 */
export const getCacheInfo = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (!cachedData) {
      return null;
    }
    
    const parsedCache = JSON.parse(cachedData);
    return {
      timestamp: parsedCache.timestamp,
      version: parsedCache.version,
      size: new Blob([cachedData]).size,
      symbolCount: parsedCache.data?.symbols?.length || 0
    };
  } catch (error) {
    return null;
  }
};

/**
 * 防抖函数，用于延迟保存
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// 创建防抖的保存函数，避免频繁保存
export const debouncedSaveToCache = debounce(saveToCache, 1000); // 1秒延迟