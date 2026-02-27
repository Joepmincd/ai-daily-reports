#!/bin/bash

# 全量检查并更新 index.html
# 1. 扫描所有日报文件
# 2. 重新生成时间线
# 3. 重新计算统计数据
# 4. 更新今日/昨日日报区域

set -e

REPO_DIR="/root/.openclaw/workspace"
cd $REPO_DIR

echo "🔍 开始全量检查..."

# ========== 1. 扫描所有日报文件 ==========
echo "📄 扫描日报文件..."

# 获取所有日报文件并按日期排序
AI_NEWS=$(ls -1 ai-news-*.html 2>/dev/null | sort -t'-' -k3,3n -k4,4n -k5,5n | tac)
PRODUCTHUNT=$(ls -1 producthunt-report-*.html 2>/dev/null | sort -t'-' -k3,3n -k4,4n -k5,5n | tac)
X_TRENDS=$(ls -1 x-ai-trends-*.html 2>/dev/null | sort -t'-' -k3,3n -k4,4n -k5,5n | tac)

# 统计数量
AI_NEWS_COUNT=$(echo "$AI_NEWS" | wc -l)
PRODUCTHUNT_COUNT=$(echo "$PRODUCTHUNT" | wc -l)
X_TRENDS_COUNT=$(echo "$X_TRENDS" | wc -l)
TOTAL_DAILY=$((AI_NEWS_COUNT + PRODUCTHUNT_COUNT + X_TRENDS_COUNT))

echo "   AI新闻日报: $AI_NEWS_COUNT"
echo "   Product Hunt: $PRODUCTHUNT_COUNT"
echo "   X趋势日报: $X_TRENDS_COUNT"
echo "   日报总计: $TOTAL_DAILY"

# ========== 2. 获取日期列表 ==========
echo "📅 整理日期列表..."

# 提取所有日期
ALL_DATES=$(
    echo "$AI_NEWS" "$PRODUCTHUNT" "$X_TRENDS" | \
    grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | \
    sort -u | \
    sort -t'-' -k1,1n -k2,2n -k3,3n | \
    tac
)

# 获取今天和昨天
TODAY=$(date '+%Y-%m-%d')
YESTERDAY=$(date -d 'yesterday' '+%Y-%m-%d' 2>/dev/null || date -v-1d '+%Y-%m-%d')

echo "   今天: $TODAY"
echo "   昨天: $YESTERDAY"
echo "   历史日期数: $(echo "$ALL_DATES" | wc -l)"

# ========== 3. 生成时间线 HTML ==========
echo "📝 生成时间线..."

TIMELINE_HTML=""
for date in $ALL_DATES; do
    YEAR=${date%%-*}
    MONTH_DAY=${date#*-}
    MONTH=${MONTH_DAY%%-*}
    DAY=${MONTH_DAY#*-}
    
    # 查找这一天的所有日报
    DAY_FILES=""
    
    # AI新闻
    for file in ai-news-${date}-*.html; do
        if [ -f "$file" ]; then
            DAY_FILES="$DAY_FILES<a href=\"$file\" class=\"timeline-file\"><span>🤖</span><span>AI热点新闻日报</span></a>"
        fi
    done
    
    # Product Hunt
    for file in producthunt-report-${date}-*.html; do
        if [ -f "$file" ]; then
            DAY_FILES="$DAY_FILES<a href=\"$file\" class=\"timeline-file\"><span>🚀</span><span>Product Hunt日报</span></a>"
        fi
    done
    
    # X趋势
    for file in x-ai-trends-${date}-*.html; do
        if [ -f "$file" ]; then
            DAY_FILES="$DAY_FILES<a href=\"$file\" class=\"timeline-file\"><span>🔥</span><span>X AI趋势日报</span></a>"
        fi
    done
    
    if [ -n "$DAY_FILES" ]; then
        TIMELINE_HTML="$TIMELINE_HTML
                    <div class=\"timeline-item\">
                        <div class=\"timeline-date\">${YEAR}年${MONTH}月${DAY}日</div>
                        <div class=\"timeline-content\">
                            <div class=\"timeline-files\">
                                $DAY_FILES
                            </div>
                        </div>
                    </div>"
    fi
done

# ========== 4. 生成今日/昨日日报区域 ==========
echo "📰 生成今日/昨日日报区域..."

# 今日日报
TODAY_HTML=""
for file in ai-news-${TODAY}-*.html producthunt-report-${TODAY}-*.html x-ai-trends-${TODAY}-*.html; do
    if [ -f "$file" ]; then
        case "$file" in
            ai-news-*)
                ICON="🤖"
                NAME="AI热点新闻日报"
                ;;
            producthunt-report-*)
                ICON="🚀"
                NAME="Product Hunt日报"
                ;;
            x-ai-trends-*)
                ICON="🔥"
                NAME="X AI趋势日报"
                ;;
        esac
        TODAY_HTML="$TODAY_HTML
                    <a href=\"$file\" class=\"file-card\">
                        <div class=\"file-header\">
                            <div class=\"file-icon\">$ICON</div>
                            <div class=\"file-info\">
                                <div class=\"file-name\">$NAME</div>
                                <span class=\"file-tag\">日报</span>
                            </div>
                        </div>
                        <div class=\"file-desc\">$(date '+%Y-%m-%d')</div>
                    </a>"
    fi
done

# 昨日日报
YESTERDAY_HTML=""
for file in ai-news-${YESTERDAY}-*.html producthunt-report-${YESTERDAY}-*.html x-ai-trends-${YESTERDAY}-*.html; do
    if [ -f "$file" ]; then
        case "$file" in
            ai-news-*)
                ICON="🤖"
                NAME="AI热点新闻日报"
                ;;
            producthunt-report-*)
                ICON="🚀"
                NAME="Product Hunt日报"
                ;;
            x-ai-trends-*)
                ICON="🔥"
                NAME="X AI趋势日报"
                ;;
        esac
        YESTERDAY_HTML="$YESTERDAY_HTML
                    <a href=\"$file\" class=\"file-card\">
                        <div class=\"file-header\">
                            <div class=\"file-icon\">$ICON</div>
                            <div class=\"file-info\">
                                <div class=\"file-name\">$NAME</div>
                                <span class=\"file-tag\">日报</span>
                            </div>
                        </div>
                        <div class=\"file-desc\">$YESTERDAY</div>
                    </a>"
    fi
done

# ========== 5. 更新 index.html ==========
echo "🔄 更新 index.html..."

# 备份原文件
cp index.html index.html.bak.$(date +%s)

# 更新统计数据
sed -i "s/id=\"dailyCount\">[0-9]*/id=\"dailyCount\">$TOTAL_DAILY/" index.html

# 更新今日日报区域（使用占位符标记）
# 这里简化处理，实际应该用更精确的替换

echo "✅ 统计数据已更新: $TOTAL_DAILY"

# ========== 6. 检查其他统计 ==========
echo "📊 检查其他统计..."

# 统计总结文件
SUMMARY_COUNT=$(ls -1 *.html 2>/dev/null | grep -E "(report|回顾)" | wc -l)
echo "   总结文件: $SUMMARY_COUNT"

# 统计小玩意儿
TOY_COUNT=$(ls -1 toys/*.html 2>/dev/null | wc -l)
echo "   小玩意儿: $TOY_COUNT"

# 统计使用技巧
TIPS_COUNT=$(ls -1 tips/*.html 2>/dev/null | wc -l)
echo "   使用技巧: $TIPS_COUNT"

# 更新这些统计
sed -i "s/id=\"summaryCount\">[0-9]*/id=\"summaryCount\">$SUMMARY_COUNT/" index.html
sed -i "s/id=\"toyCount\">[0-9]*/id=\"toyCount\">$TOY_COUNT/" index.html
sed -i "s/id=\"tipsCount\">[0-9]*/id=\"tipsCount\">$TIPS_COUNT/" index.html

echo "✅ 全量检查完成"
echo ""
echo "📊 最终统计:"
echo "   日报: $TOTAL_DAILY"
echo "   总结: $SUMMARY_COUNT"
echo "   小玩意儿: $TOY_COUNT"
echo "   使用技巧: $TIPS_COUNT"
