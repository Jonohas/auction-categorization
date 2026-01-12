interface StatCardProps {
  value: string | number;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-3xl font-bold text-indigo-600">{value}</div>
      <div className="text-gray-600 mt-1">{label}</div>
    </div>
  );
}
