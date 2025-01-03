export const readJSFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        console.log('原始文件内容:', content);
        
        // 清理注释和多余的空白
        let cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
                                .trim();
        console.log('清理后的内容:', cleanContent);
        
        // 提取对象内容
        const match = cleanContent.match(/module\.exports\s*=\s*({[\s\S]*});?\s*$/);
        
        if (!match) {
          throw new Error('无法解析文件格式，请确保文件包含 module.exports = {...}');
        }
        
        let jsonStr = match[1].trim();
        
        // 给没有引号的属性名添加引号
        jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
        console.log('添加引号后的 JSON 字符串:', jsonStr);
        
        // 处理可能的尾部逗号
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
        console.log('处理后的 JSON 字符串:', jsonStr);
        
        const data = JSON.parse(jsonStr);
        console.log('解析后的数据:', data);
        
        resolve(data);
      } catch (error) {
        console.error('解析错误:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => {
      console.error('读取文件错误:', error);
      reject(error);
    };
    reader.readAsText(file);
  });
}; 