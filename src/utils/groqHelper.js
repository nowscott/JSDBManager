import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: "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",
  dangerouslyAllowBrowser: true
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
    console.log('准备调用 AI 生成内容...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `你是一位用乔布斯风格解释符号的专家。请以 JSON 格式输出内容，遵循以下 schema：
${JSON.stringify(schema, null, 2)}

根据符号类型调整第二段内容：
1. 货币符号、数学符号、宗教符号等：
- 介绍符号的历史渊源
- 说明文化背景和演变
- 突出现代意义

2. 标点符号、盲文、编辑符号等：
- 详细说明使用方法
- 描述具体应用场景
- 强调实用价值

要求：
- 第一段统一介绍符号的基本定义和主要用途
- 第二段根据符号类型选择介绍历史或用法
- 使用简单有力的语言，突出重要性
- 不要使用"这个符号..."等指代开头
输出必须是有效的 JSON 格式。`
        },
        {
          role: "user",
          content: `请为符号 "${symbol}"（${symbolName}）生成两段式介绍，并以 JSON 格式返回。`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 8096,
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