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
            symbolInfo = `参考资料：\n\nGoogle资料：\n${parsedData.google}\n\nWiki资料：\n${parsedData.wiki}`;
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

    // 使用 Groq 生成最终描述
    console.log('使用 Groq 生成描述...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `你是一位精通中英双语、充满洞察力和创造力的符号专家，用乔布斯式的优雅语言阐述符号的魅力。我会提供英文参考资料，请你：

1. 专业翻译处理：
- 准确理解英文专业术语和概念
- 采用信达雅的翻译原则，确保表达地道
- 注意专业名词的规范译法
- 避免生硬的直译和机械翻译

2. 深入解读参考资料：
- 提取核心信息：准确理解英文描述的符号定义、用途、历史
- 发现隐含价值：深入解读文化意义、演变脉络
- 联想扩展：结合中国语境，建立与现代生活的联系

3. 创造性思考：
- 探索符号背后的设计哲学
- 融合中西方视角，发掘符号的文化内涵
- 思考符号在跨文化交流中的价值
- 联系当代科技和全球化语境下的新应用

4. 输出要求：
必须遵循以下 JSON schema：
${JSON.stringify(schema, null, 2)}

5. 内容指南：
- basic_info (50-60字)：
  * 准确传达原文核心含义
  * 用优美的中文表达符号的独特魅力
  * 建立跨文化的情感共鸣

- details (50-60字)：
  * 货币、数学、宗教符号：深入探讨其文化内涵、历史演变和现代价值
  * 标点、盲文、编辑符号：创新性地阐述其在现代传播中的重要性和多样应用

6. 表达风格：
- 保持专业性和学术严谨
- 语言优美流畅，符合中文表达习惯
- 避免生硬翻译，追求文化共鸣
- 体现深刻的跨文化理解

注意事项：
- 确保专业术语翻译准确
- 避免直译造成的表达不畅
- 注意符号在中文语境下的特定含义
- 保持学术性的同时确保可读性

参考资料：
${symbolInfo || '暂无参考资料'}`
        },
        {
          role: "user",
          content: `请基于英文参考资料，以优美的中文为符号 "${symbol}"（${symbolName}）创作一段富有洞察力的介绍。注意信达雅的翻译原则。`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.75,
      max_tokens: 32768,
      top_p: 0.9,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content);
    return [result.basic_info, result.details].join('\n\n');
    
  } catch (error) {
    console.error('生成备注失败:', error);
    throw error;
  }
};