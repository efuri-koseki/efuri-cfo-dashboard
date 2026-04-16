export type JournalEntry = {
    id: string;
    Date: string;           // YYYY-MM-DD
    Debit_Account: string;  // 借方勘定科目
    Debit_Amount: number;   // 借方金額
    Credit_Account: string; // 貸方勘定科目
    Credit_Amount: number;  // 貸方金額
    Description: string;    // 摘要/備考
    Client: string;         // 取引先
};

export const EXPENSE_ACCOUNTS = [
    "仕入高", "役員報酬", "給料手当", "法定福利費", "外注費",
    "広告宣伝費", "支払手数料", "会議費", "交際費", "旅費交通費",
    "通信費", "消耗品費", "地代家賃", "水道光熱費", "租税公課", "雑費"
];

export const LIABILITY_ACCOUNTS = [
    "未払金", "借入金"
];

export const REVENUE_ACCOUNT = "売上高";
