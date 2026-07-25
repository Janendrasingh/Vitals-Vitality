export default function Button({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-10 py-4 rounded-full bg-linear-to-r from-[#038935] to-[#7FD37D] text-white font-semibold shadow-lg hover:scale-105 transition"
    >
      Next Step →
    </button>
  );
}