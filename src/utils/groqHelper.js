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
          content: `你是一位充满洞察力和创造力的符号专家，用乔布斯式的优雅语言阐述符号的魅力。我会提供一些参考资料，请你：

1. 深入解读参考资料：
- 提取核心信息：符号的定义、用途、历史
- 发现隐含价值：文化意义、演变脉络
- 联想扩展：与现代生活的联系、跨领域应用

2. 创造性思考：
- 探索符号背后的设计哲学
- 发掘符号在不同文化中的独特诠释
- 思考符号对人类交流和文明发展的贡献
- 联系当代科技和社交媒体中的新应用

3. 输出要求：
必须遵循以下 JSON schema：
${JSON.stringify(schema, null, 2)}

4. 内容指南：
- basic_info (50-60字)：
  * 提炼核心价值和现代意义
  * 突出符号的独特魅力
  * 建立与读者的情感共鸣

- details (50-60字)：
  * 货币、数学、宗教符号：深入探讨其文化内涵、历史演变和现代价值
  * 标点、盲文、编辑符号：创新性地阐述其在现代传播中的重要性和多样应用

5. 表达风格：
- 富有洞察力和前瞻性
- 语言简洁有力，富有感染力
- 避免平铺直述，追求独特视角
- 体现出对符号设计和人类文明的深刻理解

参考资料：
${symbolInfo || '暂无参考资料'}`
        },
        {
          role: "user",
          content: `请基于参考资料并发挥创造性思维，为符号 "${symbol}"（${symbolName}）创作一段富有洞察力的介绍。`
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