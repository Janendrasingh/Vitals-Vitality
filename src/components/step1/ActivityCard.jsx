export default function ActivityCard({
  title,
  description,
  icon,
  active,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-6 cursor-pointer transition-all duration-300 border hover:-translate-y-1 hover:shadow-lg
      ${
        active
          ? "border-green-600 bg-green-50 shadow-lg"
          : "border-gray-200 bg-white hover:border-green-400"
      }`}
    >
      <div className="text-2xl">{icon}</div>

      <h2 className="font-bold mt-3">{title}</h2>

      <p className="text-sm text-gray-500 mt-2">
        {description}
      </p>
    </div>
  );
}