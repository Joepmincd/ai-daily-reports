#!/bin/bash

# 全量检查并更新 index.html
# 只统计 index.html 中实际引用的有效文件

set -e

REPO_DIR="/root/.openclaw/workspace"
cd $REPO_DIR

echo "🔍 开始全量检查（只统计 index.html 引用的文件）..."

# ========== 1. 从 index.html 提取引用的文件 ==========
echo "📄 分析 index.html 引用的文件..."

# 提取所有 href 链接
REFERENCED_FILES=$(grep -oE 'href="[^"]*\.html"' index.html | sed 's/href="//;s/"$//' | sort -u)

# 分类统计
echo ""
echo "📊 index.html 引用的文件:"
echo "$REFERENCED_FILES" | while read file; do
    echo "   - $file"
done

# ========== 2. 统计各类文件 ==========
echo ""
echo "📈 统计有效文件数量..."

# 日报文件（在 index.html 中引用的）
AI_NEWS_COUNT=$(echo "$REFERENCED_FILES" | grep -c "ai-news-" || echo "0")
PRODUCTHUNT_COUNT=$(echo "$REFERENCED_FILES" | grep -c "producthunt-report-" || echo "0")
X_TRENDS_COUNT=$(echo "$REFERENCED_FILES" | grep -c "x-ai-trends-" || echo "0")
DAILY_COUNT=$((AI_NEWS_COUNT + PRODUCTHUNT_COUNT + X_TRENDS_COUNT))

# 总结文件
SUMMARY_COUNT=$(echo "$REFERENCED_FILES" | grep -E "(report|回顾)" | grep -v "producthunt" | wc -l)

# 使用技巧
TIPS_COUNT=$(echo "$REFERENCED_FILES" | grep "tips/" | wc -l)

# 小玩意儿
TOY_COUNT=$(echo "$REFERENCED_FILES" | grep "toys/" | wc -l)

echo ""
echo "📊 统计结果（仅 index.html 引用的文件）:"
echo "   AI新闻日报: $AI_NEWS_COUNT"
echo "   Product Hunt: $PRODUCTHUNT_COUNT"
echo "   X趋势日报: $X_TRENDS_COUNT"
echo "   📰 日报总计: $DAILY_COUNT"
echo "   📚 总结: $SUMMARY_COUNT"
echo "   💡 使用技巧: $TIPS_COUNT"
echo "   🎮 小玩意儿: $TOY_COUNT"

# ========== 3. 更新 index.html 统计数据 ==========
echo ""
echo "🔄 更新 index.html 统计数据..."

# 更新统计数据（使用精确匹配避免误替换）
sed -i "s/id=\"dailyCount\">[0-9]*/id=\"dailyCount\">$DAILY_COUNT/" index.html
sed -i "s/id=\"summaryCount\">[0-9]*/id=\"summaryCount\">$SUMMARY_COUNT/" index.html
sed -i "s/id=\"tipsCount\">[0-9]*/id=\"tipsCount\">$TIPS_COUNT/" index.html
sed -i "s/id=\"toyCount\">[0-9]*/id=\"toyCount\">$TOY_COUNT/" index.html

echo "✅ 统计数据已更新"

# ========== 4. 检查未引用的文件（可选清理） ==========
echo ""
echo "🔍 检查未在 index.html 引用的文件..."

# 获取所有 HTML 文件
ALL_HTML=$(find . -maxdepth 1 -name "*.html" -type f | sed 's|^\./||' | sort)

# 找出未引用的文件（排除 index.html）
UNREFERENCED=$(echo "$ALL_HTML" | while read file; do
    if [ "$file" != "index.html" ]; then
        if ! echo "$REFERENCED_FILES" | grep -q "^$file$"; then
            echo "$file"
        fi
    fi
done)

if [ -n "$UNREFERENCED" ]; then
    echo ""
    echo "⚠️  以下文件未被 index.html 引用:"
    echo "$UNREFERENCED" | while read file; do
        echo "   - $file"
    done
    echo ""
    echo "💡 建议: 将这些文件添加到 index.html 或删除"
else
    echo "✅ 所有文件都被正确引用"
fi

echo ""
echo "========================================"
echo "✅ 全量检查完成"
echo "========================================"
echo ""
echo "📊 最终统计（仅有效文件）:"
echo "   日报: $DAILY_COUNT"
echo "   总结: $SUMMARY_COUNT"
echo "   使用技巧: $TIPS_COUNT"
echo "   小玩意儿: $TOY_COUNT"
echo ""
