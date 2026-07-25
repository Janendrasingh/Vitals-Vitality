export default function GoalCard({
  title,
  description,
  icon,
  active,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-6 cursor-pointer border transition-all duration-300
      hover:-translate-y-1 hover:shadow-lg

      ${
        active
          ? "border-green-600 bg-green-50 shadow-lg"
          : "border-gray-200 bg-white hover:border-green-400"
      }`}
    >
      <div className="text-2xl">{icon}</div>

      <h2 className="mt-3 font-bold text-lg">
        {title}
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
}