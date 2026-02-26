// 技能侠 - 后端服务
// 调用 Kimi 深度研究接口生成高质量技能学习指南

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

// 生成技能指南 - 使用深度研究模式
async function generateSkillGuide(skill) {
    const systemPrompt = `你是一位顶级的技能导师和课程设计专家，擅长为初学者设计系统化、高质量的学习路径。

你的教学理念：
1. 深度而非广度 - 每个知识点都要讲透，而不是泛泛而谈
2. 实践导向 - 每个理论都要有对应的动手练习
3. 循序渐进 - 从简单到复杂，建立知识体系
4. 真实案例 - 使用真实世界的案例，而非玩具示例

输出要求：
- 内容要具体、可操作，避免空洞的理论
- 每个步骤都要有明确的行动指引
- 提供真实可用的资源链接或搜索关键词
- 预判学习者的困难点并给出解决方案`;

    const userPrompt = `请为"${skill}"生成一份深度、系统、高质量的学习指南。

## 要求深度研究的内容：

### 1. 技能全景分析（是什么）
- 这个技能的完整定义和核心概念体系
- 它在行业中的定位和重要性
- 主要应用领域和实际价值
- 与其他相关技能的关系图谱
- 学习这个技能需要具备的前置知识

### 2. 深度价值分析（为什么）
- 学习这个技能的具体收益（量化描述）
- 在职业发展中的具体应用场景
- 市场需求的现状和趋势
- 不同水平的能力对应的价值差异
- 长期发展的可能性

### 3. 系统化学习路径（怎么样）
请设计一个完整的学习体系：

**第一阶段：基础构建（第1-2周）**
- 核心概念详解（3-5个核心概念）
- 每个概念的具体解释和实例
- 配套练习（每个概念2-3个练习）
- 检验标准（如何判断第一阶段达标）

**第二阶段：技能深化（第3-4周）**
- 进阶技术点（4-6个技术点）
- 常见误区和避坑指南
- 实战小项目（2-3个）
- 代码/操作示例（具体可运行）

**第三阶段：综合应用（第5-6周）**
- 完整项目实战（从0到1）
- 最佳实践和行业规范
- 性能优化和进阶技巧
- 如何持续学习和提升

### 4. 完整实战案例
提供一个可以跟着做的完整项目：
- 项目背景和目标
- 详细步骤（至少10步，每步都有具体说明）
- 完整的代码/操作示例
- 预期结果和验收标准
- 常见问题和解决方案
- 扩展思路和进阶方向

### 5. 学习资源地图
- 推荐书籍（3-5本，说明适合阶段）
- 在线课程（3-5个，说明优缺点）
- 官方文档和权威网站
- 社区和论坛推荐
- 练习平台和工具

### 6. 学习路线图
- 6周的详细学习计划
- 每天的学习任务（具体到小时）
- 每周的里程碑和检验点
- 学习笔记和知识整理方法

输出格式要求：
请以 JSON 格式返回，所有内容使用 HTML 标签格式化：
{
  "difficulty": "学习难度和预计时间",
  "tags": ["标签1", "标签2", "标签3"],
  "what": "HTML格式的详细内容",
  "why": "HTML格式的详细内容", 
  "how": "HTML格式的详细内容",
  "case": "HTML格式的详细内容",
  "roadmap": "HTML格式的详细内容"
}

注意：
1. 内容要深入具体，不要泛泛而谈
2. 每个部分都要有实质性的内容
3. 使用 <h4>、<p>、<ul>、<ol>、<li>、<div> 等 HTML 标签
4. 重要内容用 <strong> 或 <em> 标注
5. 使用 emoji 增加可读性`;

    try {
        console.log(`开始深度研究生成: ${skill}`);
        
        const response = await fetch(KIMI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIMI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'k2p5',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 8000,
                thinking: {
                    type: "enabled",
                    budget_tokens: 4000
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 错误:', errorText);
            throw new Error(`API 请求失败: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const content = data.choices[0].message.content;
            console.log('收到响应，长度:', content.length);
            
            // 提取 JSON 部分
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const result = JSON.parse(jsonMatch[0]);
                    console.log('解析成功');
                    return result;
                } catch (parseError) {
                    console.error('JSON 解析错误:', parseError);
                    // 尝试清理后重新解析
                    const cleaned = jsonMatch[0].replace(/\n/g, '\\n').replace(/\r/g, '');
                    return JSON.parse(cleaned);
                }
            }
        }
        
        throw new Error('响应格式不正确');
    } catch (error) {
        console.error('生成指南失败:', error);
        return getMockGuide(skill);
    }
}

// 模拟指南数据（备用）
function getMockGuide(skill) {
    return {
        difficulty: '中等 - 预计4-6周',
        tags: ['系统学习', '实战导向', '深度内容'],
        what: `<div>
            <h4>🎯 技能定义</h4>
            <p><strong>${skill}</strong>是一门需要系统学习的实用技能。</p>
            
            <h4>📚 核心概念</h4>
            <ul>
                <li><strong>基础概念：</strong>理解基本原理和术语</li>
                <li><strong>核心技能：</strong>掌握关键技术和方法</li>
                <li><strong>应用场景：</strong>知道如何在实际中使用</li>
            </ul>
            
            <h4>💡 前置知识</h4>
            <p>建议先了解相关基础知识，会更容易上手。</p>
        </div>`,
        
        why: `<div>
            <h4>📈 职业发展</h4>
            <ul>
                <li>提升职场竞争力，增加就业机会</li>
                <li>开拓新的职业发展方向</li>
                <li>提高工作效率和专业水平</li>
            </ul>
            
            <h4>💰 市场价值</h4>
            <p>掌握这项技能可以带来显著的经济回报，市场需求持续增长。</p>
            
            <h4>🚀 个人成长</h4>
            <p>培养系统思维，提升解决问题的能力。</p>
        </div>`,
        
        how: `<div>
            <h4>📅 第一阶段：基础构建（第1-2周）</h4>
            <p><strong>目标：</strong>建立知识框架，理解核心概念</p>
            <ul>
                <li>学习基本概念和术语</li>
                <li>完成基础练习</li>
                <li>建立学习笔记系统</li>
            </ul>
            
            <h4>🔧 第二阶段：技能深化（第3-4周）</h4>
            <p><strong>目标：</strong>掌握进阶技术，开始实战</p>
            <ul>
                <li>学习进阶技术点</li>
                <li>完成实战小项目</li>
                <li>总结常见问题和解决方案</li>
            </ul>
            
            <h4>🚀 第三阶段：综合应用（第5-6周）</h4>
            <p><strong>目标：</strong>完成完整项目，达到独立应用水平</p>
            <ul>
                <li>从0到1完成实战项目</li>
                <li>学习最佳实践</li>
                <li>建立持续学习习惯</li>
            </ul>
        </div>`,
        
        case: `<div>
            <h4>🌟 实战项目：从零开始</h4>
            <p><strong>项目目标：</strong>通过实际项目巩固所学知识</p>
            
            <h4>详细步骤：</h4>
            <ol>
                <li><strong>需求分析：</strong>明确项目目标和范围</li>
                <li><strong>环境搭建：</strong>准备必要的工具和资料</li>
                <li><strong>基础实现：</strong>完成核心功能</li>
                <li><strong>优化完善：</strong>改进和扩展功能</li>
                <li><strong>测试验证：</strong>确保质量达标</li>
            </ol>
            
            <h4>💡 常见问题</h4>
            <ul>
                <li>遇到问题先查阅官方文档</li>
                <li>善用搜索引擎和技术社区</li>
                <li>记录问题和解决方案</li>
            </ul>
        </div>`,
        
        roadmap: `<div>
            <h4>📚 推荐资源</h4>
            <ul>
                <li><strong>入门书籍：</strong>选择适合初学者的教材</li>
                <li><strong>在线课程：</strong>跟随系统化的视频教程</li>
                <li><strong>官方文档：</strong>作为参考和深入学习</li>
                <li><strong>练习平台：</strong>通过实战巩固知识</li>
            </ul>
            
            <h4>📅 6周学习计划</h4>
            <ul>
                <li><strong>第1-2周：</strong>基础概念学习</li>
                <li><strong>第3-4周：</strong>进阶技术掌握</li>
                <li><strong>第5-6周：</strong>项目实战</li>
            </ul>
            
            <h4>✅ 检验标准</h4>
            <ul>
                <li>能够独立完成基础任务</li>
                <li>理解核心概念和原理</li>
                <li>具备解决常见问题的能力</li>
            </ul>
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
        res.end(JSON.stringify({ status: 'ok', service: 'skill-hero', version: '2.0' }));
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

        console.log(`[${new Date().toISOString()}] 深度研究生成技能指南: ${skill}`);
        const startTime = Date.now();

        try {
            const guide = await generateSkillGuide(skill);
            const duration = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] 生成完成，耗时: ${duration}ms`);
            
            res.writeHead(200);
            res.end(JSON.stringify(guide));
        } catch (error) {
            console.error('Error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
        }
        return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🦸 技能侠服务已启动（深度研究版），端口: ${PORT}`);
    console.log(`📍 API 地址: http://localhost:${PORT}/api/skill-guide?skill=技能名称`);
    console.log(`🔍 使用 Kimi 深度研究模式生成高质量内容`);
});
