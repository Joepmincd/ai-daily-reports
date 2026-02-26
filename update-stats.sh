#!/bin/bash
# 自动更新汇总页统计数据

REPO_DIR="/root/.openclaw/workspace"
cd "$REPO_DIR"

# 统计文件数量
DAILY_COUNT=$(ls -1 x-ai-trends-*.html ai-news-*.html producthunt-report-*.html 2>/dev/null | wc -l)
SUMMARY_COUNT=$(ls -1 *总结*.html 2>/dev/null | wc -l)
TOY_COUNT=$(ls -1 toys/*.html 2>/dev/null | wc -l)

echo "统计结果:"
echo "- 日报: $DAILY_COUNT"
echo "- 总结: $SUMMARY_COUNT"
echo "- 小玩意儿: $TOY_COUNT"

# 更新index.html
sed -i "s/id=\"dailyCount\">[0-9]*/id=\"dailyCount\">$DAILY_COUNT/" index.html
sed -i "s/id=\"summaryCount\">[0-9]*/id=\"summaryCount\">$SUMMARY_COUNT/" index.html
sed -i "s/id=\"toyCount\">[0-9]*/id=\"toyCount\">$TOY_COUNT/" index.html

echo "✅ 本地文件已更新"

# 部署到GitHub (如果配置了自动部署)
if [ -f "auto-deploy.sh" ]; then
    echo "🚀 开始部署到GitHub..."
    bash auto-deploy.sh
fi
