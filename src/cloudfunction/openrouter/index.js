// 云函数入口文件
const axios = require('axios')
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { messages, model, max_tokens = 1000, stream = false, temperature = 1, top_p = 0.8 } = event

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages,
        max_tokens,
        stream,
        temperature,
        top_p,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.KEY}`,
          'X-Title': 'StudyCard',
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    )

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error('API Response:', error)
    return {
      success: false,
      error: error.message || 'API 调用失败',
    }
  }
}
