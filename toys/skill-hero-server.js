// 技能侠 - 后端服务
// 调用 Kimi API 生成技能学习指南

const http = require('http');
const url = require('url');

// Kimi API 配置
const KIMI_API_KEY = process.env.KIMI_API_KEY || '';
const KIMI_API_URL = 'https://api.kimi.com/coding/v1/chat/completions';

// CORS 头设置
function setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

// 生成技能指南
async function generateSkillGuide(skill) {
    const prompt = `请为"${skill}"生成一份完整的学习指南，面向完全零基础的小白用户。

请按以下结构输出：

## 1. 是什么
用通俗易懂的语言解释这个技能是什么，包含：
- 简单定义（一句话说明）
- 核心概念解释（避免专业术语，用生活化比喻）
- 能做什么（列举3-5个实际应用场景）

## 2. 为什么学这个
说明学习这个技能的价值，包含：
- 个人成长价值
- 职业发展价值
- 生活实用价值
- 学习难度评估（简单/中等/困难）
- 预计学习时间

## 3. 怎么样入门
提供具体可执行的学习步骤，包含：
- 学习前的准备工作
- 第一阶段：基础概念（1周）
- 第二阶段：动手实践（2周）
- 第三阶段：项目实战（1周）
- 推荐的学习资源类型（视频/书籍/网站）

## 4. 完整入门案例
提供一个完整的、可跟着做的入门案例：
- 案例名称
- 案例目标
- 详细步骤（至少5步，每步都要具体）
- 预期成果
- 常见问题解答

## 5. 学习路线图
提供4周的学习计划：
- 每周的学习目标
- 每天的学习安排（1-2小时）
- 里程碑检查点
- 推荐的学习资源

输出要求：
1. 语言简单易懂，避免专业术语
2. 内容实用可操作，不要空洞的理论
3. 步骤详细具体，小白能跟着做
4. 使用 emoji 增加可读性
5. 重要提示用 💡 标注
6. 关键步骤用 ✅ 标注

请以 JSON 格式返回，格式如下：
{
  "difficulty": "简单/中等/困难 - 预计X周",
  "tags": ["标签1", "标签2", "标签3"],
  "what": "HTML格式的内容",
  "why": "HTML格式的内容",
  "how": "HTML格式的内容",
  "case": "HTML格式的内容",
  "roadmap": "HTML格式的内容"
}

注意：所有内容必须是有效的 HTML 字符串，可以使用简单的 HTML 标签如 <p>、<ul>、<ol>、<li>、<strong>、<div> 等。`;

    try {
        const response = await fetch(KIMI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIMI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'k2p5',
                messages: [
                    { 
                        role: 'system', 
                        content: '你是一位专业的技能导师，擅长将复杂的技能拆解成小白也能理解的入门指南。你的教学风格是：简单直接、实用为主、循序渐进。' 
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 4000
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const content = data.choices[0].message.content;
            // 提取 JSON 部分
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        }
        
        throw new Error('Invalid response format');
    } catch (error) {
        console.error('生成指南失败:', error);
        return getMockGuide(skill);
    }
}

// 模拟指南数据
function getMockGuide(skill) {
    return {
        difficulty: '中等 - 预计3-4周',
        tags: ['入门友好', '实用技能', '热门方向'],
        what: `<p><strong>${skill}</strong>是一门非常实用的技能。通过系统学习，你可以掌握核心概念和基本操作。</p>
               <p>💡 <strong>核心概念：</strong>先理解基本原理，再学习具体技巧。</p>
               <p>✅ <strong>应用场景：</strong>工作提升、个人兴趣、副业发展等。</p>`,
        why: `<ul>
                <li><strong>提升竞争力：</strong>在职场和生活中都有广泛应用</li>
                <li><strong>开拓新机会：</strong>为职业发展和个人成长创造更多可能</li>
                <li><strong>培养思维方式：</strong>锻炼逻辑思维和解决问题的能力</li>
              </ul>`,
        how: `<div>
                <div><h4>📚 第一阶段：基础概念（1周）</h4><p>了解基本原理和术语</p></div>
                <div><h4>🔧 第二阶段：动手实践（2周）</h4><p>跟着教程做练习</p></div>
                <div><h4>🚀 第三阶段：项目实战（1周）</h4><p>完成一个小项目</p></div>
              </div>`,
        case: `<div><h4>🌟 实战案例</h4><p>从最简单的例子开始，循序渐进...</p></div>`,
        roadmap: `<div>
                    <p><strong>第1周：</strong>基础入门</p>
                    <p><strong>第2-3周：</strong>进阶学习</p>
                    <p><strong>第4周：</strong>项目实战</p>
                  </div>`
    };
}

// 创建 HTTP 服务器
const server = http.createServer(async (req, res) => {
    setCORSHeaders(res);

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // 健康检查
    if (pathname === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', service: 'skill-hero' }));
        return;
    }

    // 生成技能指南
    if (pathname === '/api/skill-guide' && req.method === 'GET') {
        const skill = parsedUrl.query.skill;
        
        if (!skill) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing skill parameter' }));
            return;
        }

        console.log(`生成技能指南: ${skill}`);

        try {
            const guide = await generateSkillGuide(skill);
            res.writeHead(200);
            res.end(JSON.stringify(guide));
        } catch (error) {
            console.error('Error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
        return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🦸 技能侠服务已启动，端口: ${PORT}`);
    console.log(`📍 API 地址: http://localhost:${PORT}/api/skill-guide?skill=技能名称`);
});
