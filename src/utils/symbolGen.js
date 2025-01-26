import Groq from "groq-sdk";
import { CozeAPI } from '@coze/api';

const groq = new Groq({ 
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

const cozeClient = new CozeAPI({
  token: process.env.REACT_APP_COZE_API_TOKEN,
  baseURL: 'https://api.coze.com',
  allowPersonalAccessTokenInBrowser: true
});

// Silicon Flow API 配置
const siliconFlowConfig = {
  apiKey: process.env.REACT_APP_SILICON_FLOW_API_KEY,
  baseURL: 'https://api.siliconflow.cn/v1/chat/completions'
};

// 使用 Silicon Flow API 生成内容
const generateWithSiliconFlow = async (prompt, systemPrompt) => {
  try {
    const response = await fetch(siliconFlowConfig.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${siliconFlowConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        frequency_penalty: 1,
        max_tokens: 4096,
        n: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Silicon Flow API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Silicon Flow API 调用失败:', error);
    throw error;
  }
};

// 清理文本，去除所有多余空格和换行，使其成为单行字符串
const cleanText = (text) => {
  return text
    .replace(/\s+/g, ' ')  // 将所有空白字符（包括换行、制表符）替换为单个空格
    .replace(/"/g, '"')    // 将英文双引号替换为中文双引号
    .trim();               // 去除首尾空格
};

const schema = {
  properties: {
    basic_info: { 
      title: "BasicInfo", 
      type: "string",
      description: "符号的基本定义和主要用途，30-40字"
    },
    details: { 
      title: "Details", 
      type: "string",
      description: "根据符号类型介绍其历史背景或具体用法，30-40字"
    }
  },
  required: ["basic_info", "details"],
  title: "SymbolExplanation",
  type: "object"
};

export const generateSymbolNotes = async (symbol, symbolName) => {
  try {
    // 首先使用 Coze API 获取符号相关资料
    console.log('使用 Coze API 获取符号资料...');
    let symbolInfo = '';
    try {
      const cozeResponse = await cozeClient.workflows.runs.create({
        workflow_id: '7463092083650887698',
        parameters: {
          "input": `${symbol}`
        },
      });
      
      if (cozeResponse && cozeResponse.data) {
        try {
          const parsedData = JSON.parse(cozeResponse.data);
          if (parsedData.google || parsedData.wiki) {
            // 限制参考资料的长度，优先使用wiki内容，因为wiki通常更精炼
            const wikiContent = parsedData.wiki ? cleanText(parsedData.wiki).slice(0, 2048) : '';
            const googleContent = parsedData.google ? cleanText(parsedData.google).slice(0, 1024) : '';
            symbolInfo = `wiki:${wikiContent}\ngoogle:${googleContent}`;
            console.log('Coze 返回数据:', symbolInfo);
          } else {
            console.log('Coze 返回数据中没有 google 或 wiki 字段:', cozeResponse.data);
          }
        } catch (parseError) {
          console.error('解析 Coze 返回数据失败:', parseError);
          console.log('原始数据:', cozeResponse.data);
        }
      } else {
        console.log('Coze 响应无效:', cozeResponse);
      }
    } catch (cozeError) {
      console.error('调用 Coze API 失败:', cozeError);
      if (cozeError.response) {
        console.error('错误响应:', cozeError.response.data);
      }
      console.log('将继续使用基本信息生成描述');
    }

    // 尝试使用 Groq 生成描述
    try {
      console.log('使用 Groq 生成描述...');
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `你是一位精通中英双语的符号专家。请基于参考资料生成符号说明：

1. 内容要求：
- 总字数控制在120字以内（含标点）
- 可以自由分段，用"第X段："标记每段开始
- 内容完整且连贯，重点突出

2. 内容角度：
- 符号的基本定义和主要用途
- 历史背景或具体用法
- 现代意义和应用场景
- 文化内涵或技术价值

3. 表达要求：
- 信达雅的翻译原则
- 简洁专业的表达
- 突出符号价值
- 避免无效修饰词
- 不要使用英文双引号，如需使用引号请使用中文引号"和"

参考资料：
${symbolInfo || '暂无参考资料'}`
          },
          {
            role: "user",
            content: `请为符号 "${symbol}"（${symbolName}）创作介绍，总字数不超过120字。请用"第X段："（X为数字）标记每段内容。注意：不要使用英文双引号。`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 0.9
      });

      const content = completion.choices[0]?.message?.content.replace(/"/g, '"');
      const segments = content.split(/第\d+段：/).filter(Boolean).map(s => s.trim());
      return segments.join('\n\n');

    } catch (groqError) {
      // 如果 Groq 失败，使用 Silicon Flow 作为备用
      console.log('Groq 生成失败，切换到 Silicon Flow API...');
      console.error('Groq 错误:', groqError);

      const systemPrompt = `你是一位精通中英双语的符号专家。请基于参考资料生成符号说明：

1. 内容要求：
- 总字数控制在120字以内（含标点）
- 可以自由分段，用"第X段："标记每段开始
- 内容完整且连贯，重点突出

2. 内容角度：
- 符号的基本定义和主要用途
- 历史背景或具体用法
- 现代意义和应用场景
- 文化内涵或技术价值

3. 表达要求：
- 信达雅的翻译原则
- 简洁专业的表达
- 突出符号价值
- 避免无效修饰词
- 不要使用英文双引号

请用"第X段："（X为数字）标记每段内容。`;

      const userPrompt = `基于以下参考资料：
${symbolInfo || '暂无参考资料'}

请为符号 "${symbol}"（${symbolName}）创作介绍，总字数不超过120字。请用"第X段："（X为数字）标记每段内容。注意：不要使用英文双引号。`;

      const siliconFlowResult = await generateWithSiliconFlow(userPrompt, systemPrompt);
      console.log('Silicon Flow 返回结果:', siliconFlowResult);
      const segments = siliconFlowResult.replace(/"/g, '"').split(/第\d+段：/).filter(Boolean).map(s => s.trim());
      return segments.join('\n\n');
    }
  } catch (error) {
    console.error('生成备注失败:', error);
    throw error;
  }
};