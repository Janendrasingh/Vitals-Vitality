export default function ProgressBar({ step = 1 }) {
  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className={`h-2 w-20 rounded-full transition-all duration-500 ${
            item <= step
              ? "bg-gradient-to-r from-green-700 to-lime-400"
              : "bg-gray-200"
          }`}
        />
      ))}

      <span className="ml-6 text-sm font-bold tracking-[4px] uppercase">
        STEP {String(step).padStart(2, "0")}/04
      </span>
    </div>
  );
}