import { CheckCircle, Circle } from "lucide-react";

export default function DietCard({
  title,
  description,
  icon,
  selected,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-3xl border p-6 transition-all duration-300 hover:shadow-xl
      ${
        selected
          ? "border-green-700 shadow-md"
          : "border-gray-200 hover:border-green-300"
      }`}
    >
      {/* Check Circle */}

      <div className="absolute top-5 right-5">
        {selected ? (
          <CheckCircle
            size={22}
            className="text-green-700 fill-green-700 text-white"
          />
        ) : (
          <Circle size={22} className="text-gray-300" />
        )}
      </div>

      {/* Icon */}

      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
        ${
          selected
            ? "bg-green-700 text-white"
            : "bg-green-100"
        }`}
      >
        {icon}
      </div>

      {/* Title */}

      <h3 className="mt-6 text-2xl font-bold">
        {title}
      </h3>

      {/* Description */}

      <p className="mt-3 text-gray-500 leading-7">
        {description}
      </p>
    </div>
  );
}