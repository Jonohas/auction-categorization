import { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  CardContent,
  PageLoadingSpinner,
  AlertMessage,
  Button,
} from "../components";

interface DatabaseStats {
  auctions: number;
  auctionItems: number;
  categoryProbabilities: number;
}

const DatabaseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export function DatabasePage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [wiping, setWiping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/getDatabaseStats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError("Failed to fetch database stats");
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (table: string) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(table)) {
      newSelected.delete(table);
    } else {
      newSelected.add(table);
    }
    setSelectedTables(newSelected);
  };

  const handleWipe = async () => {
    if (selectedTables.size === 0) {
      setError("Please select at least one table to wipe");
      return;
    }

    const tableNames = Array.from(selectedTables);
    const confirmMessage = `Are you sure you want to delete ALL data from the following tables?\n\n- ${tableNames.join("\n- ")}\n\nThis action cannot be undone!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setWiping(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/wipeTables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: tableNames }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to wipe tables");
      }

      const deletedSummary = Object.entries(data.deleted)
        .map(([table, count]) => `${table}: ${count} records`)
        .join(", ");

      setSuccess(`Successfully wiped tables. Deleted: ${deletedSummary}`);
      setSelectedTables(new Set());
      fetchStats();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWiping(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedTables.size === 3) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(["auctions", "auctionItems", "categoryProbabilities"]));
    }
  };

  if (loading) {
    return <PageLoadingSpinner />;
  }

  const tables = [
    {
      id: "auctions",
      name: "Auctions",
      description: "All auction records scraped from websites",
      count: stats?.auctions ?? 0,
    },
    {
      id: "auctionItems",
      name: "Auction Items",
      description: "Individual items within auctions",
      count: stats?.auctionItems ?? 0,
    },
    {
      id: "categoryProbabilities",
      name: "Category Probabilities",
      description: "AI-generated category probability scores for items",
      count: stats?.categoryProbabilities ?? 0,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Database Management"
        subtitle="View and manage database tables"
      />

      {success && <AlertMessage type="success" message={success} className="mb-4" />}
      {error && <AlertMessage type="error" message={error} className="mb-4" />}

      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <DatabaseIcon />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Database Tables</h3>
                <p className="text-sm text-gray-500">Select tables to wipe their data</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedTables.size === 3 ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div className="space-y-3">
            {tables.map((table) => (
              <label
                key={table.id}
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTables.has(table.id)
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTables.has(table.id)}
                    onChange={() => toggleTable(table.id)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{table.name}</p>
                    <p className="text-sm text-gray-500">{table.description}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  table.count > 0 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                }`}>
                  {table.count.toLocaleString()} records
                </span>
              </label>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="danger"
              onClick={handleWipe}
              disabled={selectedTables.size === 0 || wiping}
              className="w-full sm:w-auto"
            >
              <TrashIcon />
              <span className="ml-2">
                {wiping ? "Wiping..." : `Wipe Selected Tables (${selectedTables.size})`}
              </span>
            </Button>
            {selectedTables.size > 0 && (
              <p className="mt-2 text-sm text-red-600">
                Warning: This will permanently delete all data from the selected tables.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
