// Cloudflare Worker - API 代理服务
// 统一处理所有第三方 API 调用，保护 API Keys

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS 头设置
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 健康检查
    if (pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        service: 'ai-daily-api-proxy',
        timestamp: new Date().toISOString()
      }, corsHeaders);
    }

    // 和风天气 API 代理
    if (pathname === '/api/weather') {
      return handleWeatherRequest(url, env, corsHeaders);
    }

    // 城市攻略 API
    if (pathname === '/api/guide') {
      return handleGuideRequest(url, env, corsHeaders);
    }

    // 技能指南 API
    if (pathname === '/api/skill-guide') {
      return handleSkillGuideRequest(url, request, env, corsHeaders);
    }

    // 高德地图 - 周边城市搜索
    if (pathname === '/api/nearby-cities') {
      return handleNearbyCitiesRequest(url, env, corsHeaders);
    }

    // 高德地图 - 反向地理编码（定位）
    if (pathname === '/api/location') {
      return handleLocationRequest(url, env, corsHeaders);
    }

    // 404
    return jsonResponse({ error: 'Not found' }, corsHeaders, 404);
  }
};

// 和风天气 API 处理
async function handleWeatherRequest(url, env, corsHeaders) {
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const date = url.searchParams.get('date') || '0';

  if (!lat || !lon) {
    return jsonResponse({ error: 'Missing lat or lon parameter' }, corsHeaders, 400);
  }

  const qweatherKey = env.QWEATHER_KEY;
  if (!qweatherKey) {
    return jsonResponse({ error: 'QWEATHER_KEY not configured' }, corsHeaders, 500);
  }

  try {
    const dayDiff = parseInt(date);
    let weatherUrl;
    
    if (dayDiff === 0) {
      // 实时天气
      weatherUrl = `https://devapi.qweather.com/v7/weather/now?location=${lon},${lat}&key=${qweatherKey}`;
    } else {
      // 3天预报
      weatherUrl = `https://devapi.qweather.com/v7/weather/3d?location=${lon},${lat}&key=${qweatherKey}`;
    }

    const response = await fetch(weatherUrl);
    const data = await response.json();

    if (data.code === '200') {
      return jsonResponse(data, corsHeaders);
    } else {
      console.error('QWeather API error:', data.code);
      return jsonResponse({ error: 'Weather API error', code: data.code }, corsHeaders, 502);
    }
  } catch (error) {
    console.error('Weather request failed:', error);
    return jsonResponse({ error: 'Request failed', message: error.message }, corsHeaders, 500);
  }
}

// 城市攻略 API 处理（使用 AI 生成）
async function handleGuideRequest(url, env, corsHeaders) {
  const city = url.searchParams.get('city');
  
  if (!city) {
    return jsonResponse({ error: 'Missing city parameter' }, corsHeaders, 400);
  }

  // 返回城市攻略数据（简化版，实际可调用 AI API 生成）
  const guide = generateCityGuide(city);
  return jsonResponse(guide, corsHeaders);
}

// 技能指南 API 处理
async function handleSkillGuideRequest(url, request, env, corsHeaders) {
  const skill = url.searchParams.get('skill');
  
  if (!skill) {
    return jsonResponse({ error: 'Missing skill parameter' }, corsHeaders, 400);
  }

  const kimiKey = env.KIMI_API_KEY;
  const deepseekKey = env.DEEPSEEK_API_KEY;
  
  // 优先使用 Kimi，如果失败则使用 DeepSeek，最后使用模拟数据
  if (kimiKey) {
    try {
      const guide = await generateSkillGuideWithKimi(skill, kimiKey);
      return jsonResponse(guide, corsHeaders);
    } catch (error) {
      console.error('Kimi API failed:', error);
      // 继续尝试 DeepSeek
    }
  }
  
  if (deepseekKey) {
    try {
      const guide = await generateSkillGuideWithDeepSeek(skill, deepseekKey);
      return jsonResponse(guide, corsHeaders);
    } catch (error) {
      console.error('DeepSeek API failed:', error);
      // 继续返回模拟数据
    }
  }
  
  // 所有 API 都失败，返回模拟数据
  return jsonResponse(generateMockSkillGuide(skill), corsHeaders);
}

// 使用 DeepSeek API 生成技能指南
async function generateSkillGuideWithDeepSeek(skill, apiKey) {
  const systemPrompt = `你是一位顶级的技能导师和课程设计专家，擅长为初学者设计系统化、高质量的学习路径。输出要求：内容具体可操作，使用HTML标签格式化。`;

  const userPrompt = `请为"${skill}"生成一份深度、系统、高质量的学习指南。

包含以下内容：
1. 技能全景分析（是什么）- 定义、核心概念、应用场景
2. 深度价值分析（为什么）- 职业价值、市场需求、收益
3. 系统化学习路径（怎么样）- 分3个阶段，每阶段1-2周
4. 完整实战案例 - 详细步骤（10步以上）
5. 学习资源地图 - 书籍、课程、网站
6. 学习路线图 - 6周计划

以JSON格式返回：
{
  "difficulty": "难度和时间",
  "tags": ["标签1", "标签2"],
  "what": "HTML内容",
  "why": "HTML内容",
  "how": "HTML内容",
  "case": "HTML内容",
  "roadmap": "HTML内容"
}`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from DeepSeek');
  }

  // 尝试解析 JSON
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('JSON parse failed, using fallback');
  }

  // 如果解析失败，返回格式化后的内容
  return {
    difficulty: '中等 - 预计4-6周',
    tags: ['AI生成', skill, '系统学习'],
    what: `<div><h4>🎯 关于 ${skill}</h4><p>${content.substring(0, 1500)}</p></div>`,
    why: '<div><p>掌握这项技能可以提升职业竞争力，开拓新的发展机会。</p></div>',
    how: '<div><p>建议按照基础→进阶→实战的路径系统学习。</p></div>',
    case: '<div><p>通过实际项目练习来巩固所学知识。</p></div>',
    roadmap: '<div><p>制定6周学习计划，循序渐进掌握技能。</p></div>'
  };
}

// 使用 Kimi API 生成技能指南
async function generateSkillGuideWithKimi(skill, apiKey) {
  const systemPrompt = `你是一位顶级的技能导师和课程设计专家，擅长为初学者设计系统化、高质量的学习路径。输出要求：内容具体可操作，使用HTML标签格式化。`;

  const userPrompt = `请为"${skill}"生成一份深度、系统、高质量的学习指南。

包含以下内容：
1. 技能全景分析（是什么）- 定义、核心概念、应用场景
2. 深度价值分析（为什么）- 职业价值、市场需求、收益
3. 系统化学习路径（怎么样）- 分3个阶段，每阶段1-2周
4. 完整实战案例 - 详细步骤（10步以上）
5. 学习资源地图 - 书籍、课程、网站
6. 学习路线图 - 6周计划

以JSON格式返回：
{
  "difficulty": "难度和时间",
  "tags": ["标签1", "标签2"],
  "what": "HTML内容",
  "why": "HTML内容",
  "how": "HTML内容",
  "case": "HTML内容",
  "roadmap": "HTML内容"
}`;

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Kimi API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from Kimi');
  }

  // 尝试解析 JSON
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('JSON parse failed, using fallback');
  }

  // 如果解析失败，返回格式化后的内容
  return {
    difficulty: '中等 - 预计4-6周',
    tags: ['AI生成', skill, '系统学习'],
    what: `<div><h4>🎯 关于 ${skill}</h4><p>${content.substring(0, 1500)}</p></div>`,
    why: '<div><p>掌握这项技能可以提升职业竞争力，开拓新的发展机会。</p></div>',
    how: '<div><p>建议按照基础→进阶→实战的路径系统学习。</p></div>',
    case: '<div><p>通过实际项目练习来巩固所学知识。</p></div>',
    roadmap: '<div><p>制定6周学习计划，循序渐进掌握技能。</p></div>'
  };
}

// 生成模拟技能指南
function generateMockSkillGuide(skill) {
  return {
    difficulty: '中等 - 预计4-6周',
    tags: ['系统学习', '实战导向', '职业发展'],
    what: `
      <div>
        <h4>🎯 关于 ${skill}</h4>
        <p>${skill} 是一项重要的技能，在当今数字化时代具有广泛的应用价值。</p>
        <p>通过系统学习，你可以掌握核心概念和实践方法。</p>
      </div>
    `,
    why: `
      <div>
        <h4>💡 为什么要学习 ${skill}</h4>
        <ul>
          <li><strong>职业价值：</strong>提升职场竞争力</li>
          <li><strong>市场需求：</strong>相关岗位需求持续增长</li>
          <li><strong>个人成长：</strong>拓展能力边界</li>
        </ul>
      </div>
    `,
    how: `
      <div>
        <h4>📚 学习路径</h4>
        <p><strong>第一阶段（第1-2周）：基础构建</strong></p>
        <ul>
          <li>理解核心概念和基本原理</li>
          <li>完成基础练习</li>
          <li>建立知识框架</li>
        </ul>
        <p><strong>第二阶段（第3-4周）：技能深化</strong></p>
        <ul>
          <li>学习进阶技术</li>
          <li>完成实战小项目</li>
          <li>掌握最佳实践</li>
        </ul>
        <p><strong>第三阶段（第5-6周）：综合应用</strong></p>
        <ul>
          <li>完成完整项目</li>
          <li>优化和提升</li>
          <li>总结和复盘</li>
        </ul>
      </div>
    `,
    case: `
      <div>
        <h4>🚀 实战案例</h4>
        <p>通过一个完整的项目来实践所学知识：</p>
        <ol>
          <li>确定项目目标和范围</li>
          <li>进行需求分析</li>
          <li>设计解决方案</li>
          <li>分步骤实现功能</li>
          <li>测试和优化</li>
          <li>总结项目经验</li>
        </ol>
      </div>
    `,
    roadmap: `
      <div>
        <h4>🗺️ 6周学习计划</h4>
        <table style="width:100%;border-collapse:collapse;margin-top:10px;">
          <tr style="background:#f0f4ff;">
            <th style="padding:8px;border:1px solid #ddd;">周次</th>
            <th style="padding:8px;border:1px solid #ddd;">主题</th>
            <th style="padding:8px;border:1px solid #ddd;">任务</th>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">第1周</td>
            <td style="padding:8px;border:1px solid #ddd;">基础入门</td>
            <td style="padding:8px;border:1px solid #ddd;">学习核心概念</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">第2周</td>
            <td style="padding:8px;border:1px solid #ddd;">基础练习</td>
            <td style="padding:8px;border:1px solid #ddd;">完成基础练习</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">第3周</td>
            <td style="padding:8px;border:1px solid #ddd;">进阶学习</td>
            <td style="padding:8px;border:1px solid #ddd;">掌握进阶技术</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">第4周</td>
            <td style="padding:8px;border:1px solid #ddd;">项目实践</td>
            <td style="padding:8px;border:1px solid #ddd;">完成小项目</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">第5周</td>
            <td style="padding:8px;border:1px solid #ddd;">综合项目</td>
            <td style="padding:8px;border:1px solid #ddd;">开始综合项目</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">第6周</td>
            <td style="padding:8px;border:1px solid #ddd;">优化总结</td>
            <td style="padding:8px;border:1px solid #ddd;">完成并总结</td>
          </tr>
        </table>
      </div>
    `
  };
}

// 生成城市攻略（简化版）
function generateCityGuide(city) {
  return {
    spots: [
      { name: '市中心广场', icon: '🏛️', desc: '城市地标，感受当地生活气息' },
      { name: '历史街区', icon: '🏮', desc: '漫步古街，体验传统文化' },
      { name: '城市公园', icon: '🌳', desc: '休闲放松，欣赏自然风光' },
      { name: '博物馆', icon: '🏺', desc: '了解城市历史与文化' }
    ],
    food: [
      { name: '当地特色菜', icon: '🍽️', desc: '品尝正宗本地风味' },
      { name: '街头小吃', icon: '🍢', desc: '探索路边摊美食' },
      { name: '老字号餐厅', icon: '🏪', desc: '百年老店，传统味道' },
      { name: '夜市美食', icon: '🌙', desc: '夜晚的美食聚集地' }
    ],
    activities: [
      { name: '城市漫步', icon: '🚶', desc: '探索城市街道，发现隐藏美景', time: '半天' },
      { name: '美食探索', icon: '🍜', desc: '品尝当地特色美食', time: '2小时' },
      { name: '文化体验', icon: '🎭', desc: '参观博物馆或文化景点', time: '3小时' }
    ],
    tips: ['提前规划行程路线', '关注当地天气预报', '尊重当地风俗习惯'],
    budget: '人均 300-600 元/天'
  };
}

// 高德地图 - 周边城市搜索
async function handleNearbyCitiesRequest(url, env, corsHeaders) {
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const radius = url.searchParams.get('radius') || '200000'; // 默认200km，单位米

  if (!lat || !lon) {
    return jsonResponse({ error: 'Missing lat or lon parameter' }, corsHeaders, 400);
  }

  const gaodeKey = env.GAODE_KEY;
  if (!gaodeKey) {
    return jsonResponse({ error: 'GAODE_KEY not configured' }, corsHeaders, 500);
  }

  try {
    // 使用高德地图周边搜索API查找城市
    // 先进行逆地理编码获取当前位置信息
    const regeoUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${gaodeKey}&location=${lon},${lat}&extensions=all`;
    
    const regeoResponse = await fetch(regeoUrl);
    const regeoData = await regeoResponse.json();

    if (regeoData.status !== '1') {
      console.error('Gaode regeo error:', regeoData.info);
      // 如果高德API失败，返回基于本地数据库的周边城市
      return jsonResponse(getNearbyCitiesFromDB(lat, lon, radius), corsHeaders);
    }

    // 获取当前城市信息
    const currentCity = regeoData.regeocode?.addressComponent?.city || 
                       regeoData.regeocode?.addressComponent?.province;

    // 使用高德地图搜索周边城市（通过搜索城市POI）
    // 这里我们使用一个简化的方案：基于本地城市数据库计算距离
    const nearbyCities = getNearbyCitiesFromDB(lat, lon, radius);
    
    return jsonResponse({
      current: {
        name: currentCity,
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      },
      cities: nearbyCities
    }, corsHeaders);

  } catch (error) {
    console.error('Nearby cities request failed:', error);
    // 出错时返回本地数据库结果
    return jsonResponse(getNearbyCitiesFromDB(lat, lon, radius), corsHeaders);
  }
}

// 从本地数据库获取周边城市
function getNearbyCitiesFromDB(lat, lon, radius) {
  // 城市数据库（简化版，实际可以扩展）
  const citiesDB = [
    { name: "北京", lat: 39.9042, lon: 116.4074 },
    { name: "上海", lat: 31.2304, lon: 121.4737 },
    { name: "天津", lat: 39.3434, lon: 117.3616 },
    { name: "重庆", lat: 29.5630, lon: 106.5516 },
    { name: "石家庄", lat: 38.0428, lon: 114.5149 },
    { name: "太原", lat: 37.8706, lon: 112.5489 },
    { name: "呼和浩特", lat: 40.8414, lon: 111.7519 },
    { name: "沈阳", lat: 41.8057, lon: 123.4315 },
    { name: "大连", lat: 38.9140, lon: 121.6147 },
    { name: "长春", lat: 43.8171, lon: 125.3235 },
    { name: "哈尔滨", lat: 45.8038, lon: 126.5350 },
    { name: "南京", lat: 32.0603, lon: 118.7969 },
    { name: "苏州", lat: 31.2989, lon: 120.5853 },
    { name: "杭州", lat: 30.2741, lon: 120.1551 },
    { name: "宁波", lat: 29.8683, lon: 121.5440 },
    { name: "合肥", lat: 31.8206, lon: 117.2272 },
    { name: "福州", lat: 26.0745, lon: 119.2965 },
    { name: "厦门", lat: 24.4798, lon: 118.0894 },
    { name: "南昌", lat: 28.6820, lon: 115.8579 },
    { name: "济南", lat: 36.6512, lon: 117.1201 },
    { name: "青岛", lat: 36.0671, lon: 120.3826 },
    { name: "郑州", lat: 34.7466, lon: 113.6253 },
    { name: "武汉", lat: 30.5928, lon: 114.3055 },
    { name: "长沙", lat: 28.2282, lon: 112.9388 },
    { name: "广州", lat: 23.1291, lon: 113.2644 },
    { name: "深圳", lat: 22.5431, lon: 114.0579 },
    { name: "珠海", lat: 22.2710, lon: 113.5670 },
    { name: "南宁", lat: 22.8170, lon: 108.3665 },
    { name: "桂林", lat: 25.2740, lon: 110.2993 },
    { name: "海口", lat: 20.0440, lon: 110.1999 },
    { name: "三亚", lat: 18.2528, lon: 109.5120 },
    { name: "成都", lat: 30.5728, lon: 104.0668 },
    { name: "贵阳", lat: 26.6470, lon: 106.6302 },
    { name: "昆明", lat: 25.0389, lon: 102.7183 },
    { name: "拉萨", lat: 29.6500, lon: 91.1000 },
    { name: "西安", lat: 34.3416, lon: 108.9398 },
    { name: "兰州", lat: 36.0611, lon: 103.8343 },
    { name: "西宁", lat: 36.6171, lon: 101.7782 },
    { name: "银川", lat: 38.4872, lon: 106.2309 },
    { name: "乌鲁木齐", lat: 43.8256, lon: 87.6168 },
    { name: "台北", lat: 25.0330, lon: 121.5654 },
    { name: "香港", lat: 22.3193, lon: 114.1694 },
    { name: "澳门", lat: 22.1987, lon: 113.5439 }
  ];

  const R = 6371; // 地球半径 km
  const radiusKm = parseInt(radius) / 1000; // 转换为km
  
  const nearbyCities = [];
  
  for (const city of citiesDB) {
    const dLat = (city.lat - parseFloat(lat)) * Math.PI / 180;
    const dLon = (city.lon - parseFloat(lon)) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(parseFloat(lat) * Math.PI / 180) * Math.cos(city.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance <= radiusKm && distance > 0) {
      nearbyCities.push({
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        distance: Math.round(distance * 10) / 10
      });
    }
  }
  
  // 按距离排序
  nearbyCities.sort((a, b) => a.distance - b.distance);
  
  return nearbyCities;
}

// 高德地图 - 反向地理编码（根据坐标获取城市）
async function handleLocationRequest(url, env, corsHeaders) {
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  if (!lat || !lon) {
    return jsonResponse({ error: 'Missing lat or lon parameter' }, corsHeaders, 400);
  }

  const gaodeKey = env.GAODE_KEY;
  if (!gaodeKey) {
    return jsonResponse({ error: 'GAODE_KEY not configured' }, corsHeaders, 500);
  }

  try {
    // 使用高德地图反向地理编码 API
    const regeoUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${gaodeKey}&location=${lon},${lat}&extensions=base`;

    const response = await fetch(regeoUrl);
    const data = await response.json();

    if (data.status === '1' && data.regeocode) {
      const addressComponent = data.regeocode.addressComponent;
      // 优先返回城市，如果没有城市则返回省份
      const city = addressComponent.city || addressComponent.province;
      const district = addressComponent.district;

      return jsonResponse({
        city: city ? city.replace(/市$/, '') : null, // 去掉"市"后缀
        district: district,
        province: addressComponent.province,
        address: data.regeocode.formatted_address
      }, corsHeaders);
    } else {
      console.error('Gaode regeo error:', data.info);
      return jsonResponse({ error: 'Location lookup failed', info: data.info }, corsHeaders, 502);
    }
  } catch (error) {
    console.error('Location request failed:', error);
    return jsonResponse({ error: 'Request failed', message: error.message }, corsHeaders, 500);
  }
}

// JSON 响应辅助函数
function jsonResponse(data, headers, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  });
}
