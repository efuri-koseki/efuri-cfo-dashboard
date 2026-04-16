import { getJournalData } from "../lib/sheets";
import { calculateFinancials } from "../lib/calculations";
import { ExportCSV } from "../components/ExportCSV";
import { ExportMFCsv } from "../components/ExportMFCsv";
import { ImportCsvButton } from "../components/ImportCsvButton";
import { DashboardClient } from "../components/DashboardClient";
import { cookies } from "next/headers";
import { clientsConfig } from "../lib/clients.config";
import { LogoutButton } from "../components/LogoutButton";

export default async function Home() {
  const cookieStore = await cookies();
  const clientId = cookieStore.get("client_id")?.value;

  if (!clientId || !(clientId in clientsConfig)) {
    return <div className="p-8 text-center bg-background min-h-screen text-foreground">無効なセッションです。再度ログインしてください。</div>;
  }

  const clientData = (clientsConfig as Record<string, any>)[clientId];
  const liveJournalData = await getJournalData(clientData.spreadsheetId);
  const financialData = calculateFinancials(liveJournalData);

  // Dynamically find the latest month that has data, or fallback to the current actual month
  let currentMonth = "08"; // Fallback
  if (liveJournalData.length > 0) {
    // Sort entries by date descending to find the latest
    const sortedDates = [...liveJournalData]
      .map(e => e.Date)
      .filter(d => d) // remove empty
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (sortedDates.length > 0) {
      // Get the month from the latest date (YYYY-MM-DD -> MM)
      currentMonth = sortedDates[0].split("-")[1] || "08";
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8 font-sans">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">EFURI Financial Dashboard - {clientData.name}</h1>
            <p className="text-muted-foreground mt-1">SaaS Dashboards for real-time tracking.</p>
          </div>
          <div className="flex items-center gap-4 hidden sm:flex">
            <ImportCsvButton />
            <ExportCSV data={liveJournalData} />
            <ExportMFCsv data={liveJournalData} />
            <LogoutButton />
          </div>
        </header>

        <DashboardClient financialData={financialData} initialMonth={currentMonth} />

      </div>
    </main>
  );
}
