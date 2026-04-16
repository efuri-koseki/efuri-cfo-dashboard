import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { EXPENSE_ACCOUNTS, LIABILITY_ACCOUNTS } from '@/types/journal';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { rows } = body as { rows: string[][] };

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: 'No data provided' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OPENAI_API_KEY is not configured in .env.local.' },
                { status: 500 }
            );
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const validExpenses = EXPENSE_ACCOUNTS.join(", ");
        const validLiabilities = LIABILITY_ACCOUNTS.join(", ");
        const validRevenues = "売上高";

        const systemPrompt = `
あなたはプロのCFOであり、株式会社EFURIの経理ロボットです。
提供される取引データ（ID、金額、摘要）を読み解き、適切な「借方勘定科目」と「貸方勘定科目」のみを推測し、指定されたフォーマットで返してください。

# 勘定科目のルール
- **収益の勘定科目**: ${validRevenues} のみを使用してください。
- **費用の勘定科目**: 以下のリストから最も適切なものを推測して使用してください。
  [${validExpenses}]
  ※該当するものがない場合は「雑費」または「支払手数料」などを適切に当てはめてください。
- **負債の勘定科目**: 以下のリストのいずれか、もしくは「未払金」を使用してください。
  [${validLiabilities}]

# EFURI専用・勘定科目推測辞書（絶対ルール）
以下のキーワードが摘要に含まれる場合は最優先で適用し、それ以外は一般的な経理知識に基づいて推測してください。
- 【通信費】: ソフトバンク、SoftBank、docomo、au、NTT、AWS、サーバー、ドメイン、インターネット
- 【旅費交通費】: ETC、高速、UBER、GO、タクシー、JR、メトロ、航空、Suica、PASMO
- 【交際費】: 居酒屋、レストラン、カフェ、食事、ゴルフ
- 【消耗品費】: アマゾン、Amazon、ヨドバシ、ビックカメラ、Apple、アップル、モノタロウ、ホームセンター、ビバホーム、ニトリ
- 【支払手数料】: 振込手数料、クラウドワークス、ランサーズ

# 高度な仕訳ルール（マイナス金額と支払いの処理）
- **口座振替（引き落とし）の処理**: 摘要が「口座振替」「お支払い」「前回分」等の場合、カード代金等の支払いです。仕訳は【借方: 未払金】 / 【貸方: 普通預金】 とすること。
- **キャンセル・返金の処理**: 上記以外で、金額がマイナスの取引は、通常の経費の「取り消し」です。通常の経費仕訳の借方と貸方を逆転させ、【借方: 未払金】 / 【貸方: 元の経費科目（旅費交通費など）】 として処理すること。

# 出力フォーマット
以下のJSON形式で、渡された transactions の id に対応する仕訳のみを出力してください。
\`\`\`json
{
  "results": [
    {
      "id": "row-0",
      "Debit_Account": "推測した借方勘定科目",
      "Credit_Account": "推測した貸方勘定科目"
    }
  ]
}
\`\`\`
※ 必ず \`results\` というキーを持つJSONオブジェクトを返してください。
    `;

        // 1. パススルーのための生データ前処理
        const isHeader = rows[0] && rows[0].some(cell => typeof cell === 'string' && (cell.toLowerCase().includes("date") || cell.includes("日") || cell.includes("日付")));
        const startIndex = isHeader ? 1 : 0;

        const parsedRows = [];
        const aiInput = [];

        // ヘッダー名から列の役割を特定する（より堅牢に）
        let dateIndex = -1, descIndex = -1, amountIndex = -1;
        if (isHeader) {
            rows[0].forEach((header, i) => {
                const h = header.toLowerCase();
                if (dateIndex === -1 && (h.includes("date") || h.includes("日") || h.includes("年月"))) {
                    dateIndex = i;
                } else if (descIndex === -1 && (h.includes("店名") || h.includes("摘要") || h.includes("内容") || h.includes("description") || h.includes("memo") || h.includes("名称") || h.includes("ご利用先") || h.includes("利用先"))) {
                    descIndex = i;
                } else if (amountIndex === -1 && (h.includes("金額") || h.includes("amount") || h.includes("支払") || h.includes("引出") || h.includes("利用額") || h.includes("費用"))) {
                    amountIndex = i;
                }
            });
        }

        for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0 || !row[0]) continue;

            const id = `row-${i}`;

            // --- 列インデックスが特定できなかった場合の推測フォールバック ---
            let currDateIndex = dateIndex;
            let currAmountIndex = amountIndex;
            let currDescIndex = descIndex;

            if (currDateIndex === -1) {
                currDateIndex = row.findIndex(c => /^\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?$/.test(c.trim()));
                if (currDateIndex === -1) currDateIndex = 0; // デフォルト0
            }

            if (currAmountIndex === -1) {
                // 日付以外の列で、数字カンマハイフンのみで構成される列を探す
                currAmountIndex = row.findIndex((c, idx) => idx !== currDateIndex && /^-?[\d,]+(\.\d+)?$/.test(c.trim()) && /[1-9]/.test(c));
                if (currAmountIndex === -1) currAmountIndex = row.length > 1 ? 1 : 0;
            }

            if (currDescIndex === -1) {
                // 日付と金額以外の列で最も長い文字列を探す
                let maxLen = -1;
                for (let j = 0; j < row.length; j++) {
                    if (j === currDateIndex || j === currAmountIndex) continue;
                    const cell = row[j].trim();
                    if (cell.length > maxLen) {
                        currDescIndex = j;
                        maxLen = cell.length;
                    }
                }
                if (currDescIndex === -1) currDescIndex = row.length > 2 ? 2 : 0;
            }

            // --- 値の取得とクレンジング ---
            let date = row[currDateIndex] || new Date().toISOString().split("T")[0];

            let rawAmountStr = row[currAmountIndex] || "0";
            const rawAmount = Number(rawAmountStr.replace(/[^\d.-]/g, '')) || 0;
            const absAmount = Math.abs(rawAmount);

            let desc = row[currDescIndex] || "不明な取引";

            parsedRows.push({
                id,
                date: date.trim(),
                rawAmount,
                absAmount,
                desc: desc.trim()
            });

            aiInput.push({
                id,
                amount: rawAmount, // AIにマイナス判定をさせるため生の数値を渡す
                description: desc.trim() // ここで不要な列情報を省いて渡すことで精度向上
            });
        }

        // 3. チャンク（分割）処理の実装
        const CHUNK_SIZE = 15;
        const chunks = [];
        for (let i = 0; i < aiInput.length; i += CHUNK_SIZE) {
            chunks.push(aiInput.slice(i, i + CHUNK_SIZE));
        }

        const resultMap = new Map<string, { Debit_Account: string, Credit_Account: string }>();

        // 各チャンクを並列で実行
        await Promise.all(chunks.map(async (chunk) => {
            const userData = JSON.stringify(chunk);
            try {
                const response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini', // チャンク処理による大量リクエストのため高速・低コストなモデルを利用
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `以下の取引データから借方・貸方の勘定項目のみを推測してください:\n${userData}` }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.1,
                });

                const aiContent = response.choices[0].message.content;
                if (aiContent) {
                    const parsed = JSON.parse(aiContent);
                    if (Array.isArray(parsed.results)) {
                        for (const res of parsed.results) {
                            resultMap.set(res.id, res);
                        }
                    }
                }
            } catch (err) {
                console.error("Chunk processing error:", err);
                // チャンク単位でエラーが起きてもシステムを止めず、後段のフォールバックで「不明」を割り当てる
            }
        }));

        // 2. パススルー結合処理
        const entries = parsedRows.map(pr => {
            const aiData = resultMap.get(pr.id) || { Debit_Account: "不明", Credit_Account: "不明" };
            return {
                Date: pr.date,
                Debit_Account: aiData.Debit_Account || "不明",
                Debit_Amount: pr.absAmount,
                Credit_Account: aiData.Credit_Account || "不明",
                Credit_Amount: pr.absAmount,
                Description: pr.desc || "", // 文字列はAIを通さず、必ずCSVそのままを使用
                Client: "" // 必須ではないため空
            };
        });

        return NextResponse.json({ entries });

    } catch (error: any) {
        console.error("OpenAI Endpoint Error:", error);
        return NextResponse.json(
            { error: error?.message || 'Failed to process AI request' },
            { status: 500 }
        );
    }
}
