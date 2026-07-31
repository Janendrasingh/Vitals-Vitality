export default function GenderSelector({ value, onChange }) {

  const genders = ["Male", "Female", "Non-Binary"];

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">
        Biological Gender
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {genders.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`
              py-3 px-6
              rounded-full
              font-medium
              transition-all
              duration-300
              border-2

              ${
                value === item
                  ? "bg-[#2B7C32] text-white border-green-600 shadow-lg scale-105"
                  : "bg-white text-gray-700 border-gray-300 hover:border-green-500 hover:bg-green-50"
              }
            `}
          >
            {item}
          </button>
        ))}
      </div>

      {value && (
        <p className="mt-4 text-green-600 font-medium">
          Selected Gender: <span className="font-bold">{value}</span>
        </p>
      )}
    </div>
  );
}
