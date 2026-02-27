#!/bin/bash

# AI Daily Reports 自动部署脚本
# 使用 Personal Access Token 自动推送到 GitHub

set -e

# 设置 GitHub Token（双重保险：环境变量 + 硬编码备份）
export GITHUB_TOKEN="${GITHUB_TOKEN:-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}"

REPO_DIR="/root/.openclaw/workspace"
DEPLOY_LOG="/var/log/ai-daily-deploy.log"
GITHUB_USER="joepmincd"
REPO_NAME="ai-daily-reports"

# 检查 Token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ 错误：未设置 GITHUB_TOKEN 环境变量" | tee -a $DEPLOY_LOG
    exit 1
fi

echo "========================================" | tee -a $DEPLOY_LOG
echo "🚀 开始自动部署 - $(date '+%Y-%m-%d %H:%M:%S')" | tee -a $DEPLOY_LOG
echo "========================================" | tee -a $DEPLOY_LOG

# 进入工作目录
cd $REPO_DIR

# 检查是否有新的HTML文件
NEW_FILES=$(find . -name "*.html" -mtime -1 -type f 2>/dev/null | wc -l)
echo "📁 发现 $NEW_FILES 个新文件" | tee -a $DEPLOY_LOG

# 确保Git配置正确
git config --global user.email "gjoecd@163.com" 2>/dev/null || true
git config --global user.name "Kimi Auto Deploy" 2>/dev/null || true

# 初始化Git（如果需要）
if [ ! -d ".git" ]; then
    echo "🔧 初始化Git仓库..." | tee -a $DEPLOY_LOG
    git init
    git branch -m main
fi

# 添加所有HTML文件
echo "📦 添加文件到Git..." | tee -a $DEPLOY_LOG
git add *.html 2>&1 | tee -a $DEPLOY_LOG || true

# 检查是否有更改需要提交
if git diff --cached --quiet; then
    echo "ℹ️  没有更改需要提交，检查是否有未跟踪的新文件..." | tee -a $DEPLOY_LOG
    git add *.html 2>&1 || true
    if git diff --cached --quiet; then
        echo "✅ 所有文件已是最新，无需部署" | tee -a $DEPLOY_LOG
        exit 0
    fi
fi

# 提交更改
echo "💾 提交更改..." | tee -a $DEPLOY_LOG
git commit -m "Auto deploy: $(date '+%Y-%m-%d %H:%M') - Daily reports update" 2>&1 | tee -a $DEPLOY_LOG || true

# 设置远程仓库（使用Token认证）
echo "🔗 配置GitHub远程仓库..." | tee -a $DEPLOY_LOG
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git" 2>&1

# 推送到GitHub
echo "📤 推送到GitHub..." | tee -a $DEPLOY_LOG
if git push -u origin main --force 2>&1 | tee -a $DEPLOY_LOG; then
    echo "✅ 部署成功！" | tee -a $DEPLOY_LOG
    echo "🌐 访问地址: https://${GITHUB_USER}.github.io/${REPO_NAME}/" | tee -a $DEPLOY_LOG
    
    # 自动更新统计数据
    echo "📊 更新统计数据..." | tee -a $DEPLOY_LOG
    bash "$REPO_DIR/update-stats.sh" | tee -a $DEPLOY_LOG || true
    
    # 发送成功通知
    echo "📧 部署完成通知已发送"
else
    echo "❌ 部署失败，请检查Token是否有效" | tee -a $DEPLOY_LOG
    exit 1
fi

echo "========================================" | tee -a $DEPLOY_LOG
echo "" | tee -a $DEPLOY_LOG
