export const readJSFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        
        // 清理注释和多余的空白
        let cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
                                .trim();
        
        // 提取对象内容
        const match = cleanContent.match(/module\.exports\s*=\s*({[\s\S]*});?\s*$/);
        
        if (!match) {
          throw new Error('无法解析文件格式，请确保文件包含 module.exports = {...}');
        }
        
        let jsonStr = match[1].trim();
        
        // 给没有引号的属性名添加引号
        jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
        
        // 处理连续的逗号（比如 [a, , b] 变成 [a, b]）
        jsonStr = jsonStr.replace(/,\s*,+/g, ',');
        
        // 处理数组开头的逗号
        jsonStr = jsonStr.replace(/\[\s*,/, '[');
        
        // 处理数组结尾的逗号
        jsonStr = jsonStr.replace(/,\s*\]/g, ']');
        
        // 处理可能的尾部逗号
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
        
        const data = JSON.parse(jsonStr);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}; 