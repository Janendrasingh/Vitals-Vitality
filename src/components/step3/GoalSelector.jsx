export default function WeightInput({
  value,
  onChange,
}) {
  return (
    <div>
      <label className="block text-sm font-semibold uppercase text-gray-700 mb-3">
        Target Weight (kg)
      </label>

      <div className="relative">

        <input
          type="number"
          value={value}
          onChange={(e)=>onChange(e.target.value)}
          className="w-full rounded-2xl bg-gray-100 px-6 py-5 text-3xl font-bold outline-none focus:ring-2 focus:ring-green-600"
        />

        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
          KG
        </span>

      </div>
    </div>
  );
}