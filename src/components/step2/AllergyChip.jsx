export default function AllergyChip({
  label,
  icon,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 rounded-full border px-5 py-3 transition-all duration-300 hover:scale-105 active:scale-95

      ${
        active
          ? "bg-orange-500 text-white border-orange-500 shadow-lg"
          : "bg-white border-gray-200 hover:border-orange-300 hover:shadow-md"
      }`}
    >
      <span className="text-lg">
        {icon}
      </span>

      <span className="font-medium">
        {label}
      </span>

      {active && (
        <span className="font-bold">
          ✕
        </span>
      )}
    </button>
  );
}