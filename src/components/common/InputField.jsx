export default function InputField({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="flex flex-col">

      <label
        htmlFor={name}
        className="mb-2 text-sm font-semibold text-gray-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="
          w-full
          rounded-xl
          border
          border-gray-200
          bg-gray-50
          px-4
          py-3
          text-gray-700
          outline-none

          transition-all
          duration-300

          focus:border-green-500
          focus:ring-4
          focus:ring-green-100
        "
      />

    </div>
  );
}